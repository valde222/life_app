package dk.ottes.life;

import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.core.content.IntentCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {
    private static final int MAX_IMAGE_BYTES = 25 * 1024 * 1024;
    private JSObject pending;

    @Override
    public void load() {
        pending = toShare(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        JSObject share = toShare(intent);
        if (share != null) {
            notifyListeners("shared", share, true);
        }
    }

    @PluginMethod
    public void takePending(PluginCall call) {
        JSObject result = new JSObject();
        result.put("share", pending);
        pending = null;
        call.resolve(result);
    }

    private JSObject toShare(Intent intent) {
        if (intent == null) {
            return null;
        }
        String action = intent.getAction();
        if (!Intent.ACTION_SEND.equals(action) && !Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            return null;
        }
        JSObject share = new JSObject();
        share.put("text", SharedContent.cappedText(intent.getStringExtra(Intent.EXTRA_TEXT)));
        share.put("subject", SharedContent.cappedText(intent.getStringExtra(Intent.EXTRA_SUBJECT)));
        JSArray images = new JSArray();
        for (Uri uri : imageUris(intent)) {
            JSObject image = readImage(uri);
            if (image != null) {
                images.put(image);
            }
        }
        share.put("images", images);
        intent.setAction(Intent.ACTION_MAIN);
        return share;
    }

    private List<Uri> imageUris(Intent intent) {
        List<Uri> uris = new ArrayList<>();
        if (Intent.ACTION_SEND_MULTIPLE.equals(intent.getAction())) {
            ArrayList<Uri> many = IntentCompat.getParcelableArrayListExtra(intent, Intent.EXTRA_STREAM, Uri.class);
            if (many != null) {
                uris.addAll(many);
            }
        } else {
            Uri one = IntentCompat.getParcelableExtra(intent, Intent.EXTRA_STREAM, Uri.class);
            if (one != null) {
                uris.add(one);
            }
        }
        return uris;
    }

    private JSObject readImage(Uri uri) {
        String mimeType = getContext().getContentResolver().getType(uri);
        if (!SharedContent.isReadableImage(uri.getScheme(), uri.getAuthority(), mimeType, getContext().getPackageName())) {
            return null;
        }
        try (InputStream input = getContext().getContentResolver().openInputStream(uri)) {
            if (input == null) {
                return null;
            }
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
                if (output.size() > MAX_IMAGE_BYTES) {
                    return null;
                }
            }
            JSObject image = new JSObject();
            image.put("mimeType", mimeType);
            image.put("base64", Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP));
            return image;
        } catch (Exception error) {
            return null;
        }
    }
}
