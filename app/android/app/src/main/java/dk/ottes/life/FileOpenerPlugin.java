package dk.ottes.life;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "FileOpener")
public class FileOpenerPlugin extends Plugin {
    private static final long KEEP_OPENED_MS = TimeUnit.DAYS.toMillis(1);

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        String name = FileOpening.safeName(call.getString("name"));
        if (!FileOpening.isAllowedUrl(url)) {
            call.reject("Not an address the app may download from", "BAD_URL");
            return;
        }
        new Thread(() -> {
            try {
                File file = download(url, name);
                getActivity().runOnUiThread(() -> view(call, file));
            } catch (IOException e) {
                call.reject("Could not download the file", "DOWNLOAD_FAILED", e);
            }
        }).start();
    }

    private File download(String url, String name) throws IOException {
        File opened = new File(getContext().getCacheDir(), "opened");
        removeOlderThanADay(opened);
        File folder = new File(opened, Long.toString(System.currentTimeMillis()));
        if (!folder.mkdirs()) {
            throw new IOException("Could not create " + folder);
        }
        File file = new File(folder, name);
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setInstanceFollowRedirects(false);
        try {
            if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                throw new IOException("The server answered " + connection.getResponseCode());
            }
            try (InputStream in = connection.getInputStream(); OutputStream out = new FileOutputStream(file)) {
                FileOpening.copy(in, out, FileOpening.MAX_BYTES);
            }
        } finally {
            connection.disconnect();
        }
        return file;
    }

    private void view(PluginCall call, File file) {
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
        String type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(FileOpening.extensionOf(file.getName()));
        Intent intent = new Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, type == null ? "application/octet-stream" : type)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            getActivity().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("No app opens this file", "NO_APP", e);
        }
    }

    private static void removeOlderThanADay(File opened) {
        File[] folders = opened.listFiles();
        if (folders == null) {
            return;
        }
        long cutoff = System.currentTimeMillis() - KEEP_OPENED_MS;
        for (File folder : folders) {
            if (folder.lastModified() < cutoff) {
                deleteTree(folder);
            }
        }
    }

    private static void deleteTree(File file) {
        File[] children = file.listFiles();
        if (children != null) {
            for (File child : children) {
                deleteTree(child);
            }
        }
        file.delete();
    }
}
