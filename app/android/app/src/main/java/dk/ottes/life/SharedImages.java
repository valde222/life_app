package dk.ottes.life;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import android.util.Log;
import androidx.core.content.IntentCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

final class SharedImages {
    private static final String TAG = "LifeShare";

    private final Context context;

    SharedImages(Context context) {
        this.context = context;
    }

    JSArray read(Intent intent) {
        JSArray images = new JSArray();
        for (Uri uri : uris(intent)) {
            JSObject image = read(uri);
            if (image != null) {
                images.put(image);
            }
        }
        return images;
    }

    private static List<Uri> uris(Intent intent) {
        List<Uri> uris = new ArrayList<>();
        if (Intent.ACTION_SEND_MULTIPLE.equals(intent.getAction())) {
            ArrayList<Uri> many = IntentCompat.getParcelableArrayListExtra(intent, Intent.EXTRA_STREAM, Uri.class);
            if (many != null) {
                uris.addAll(many);
            }
            return uris;
        }
        Uri one = IntentCompat.getParcelableExtra(intent, Intent.EXTRA_STREAM, Uri.class);
        if (one != null) {
            uris.add(one);
        }
        return uris;
    }

    private JSObject read(Uri uri) {
        ContentResolver resolver = context.getContentResolver();
        String mimeType = resolver.getType(uri);
        if (!SharedContent.isReadableImage(uri.getScheme(), uri.getAuthority(), mimeType, context.getPackageName())) {
            return null;
        }
        try (InputStream input = resolver.openInputStream(uri)) {
            byte[] bytes = input == null ? null : SharedContent.readCapped(input, SharedContent.MAX_IMAGE_BYTES);
            if (bytes == null) {
                return null;
            }
            JSObject image = new JSObject();
            image.put("mimeType", mimeType);
            image.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP));
            return image;
        } catch (Exception error) {
            Log.w(TAG, "Could not read a shared image", error);
            return null;
        }
    }
}
