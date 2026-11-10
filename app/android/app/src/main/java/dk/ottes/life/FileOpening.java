package dk.ottes.life;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.Arrays;
import java.util.List;

final class FileOpening {
    static final long MAX_BYTES = 50L * 1024 * 1024;
    private static final int MAX_NAME_CHARS = 120;
    private static final List<String> DEV_HOSTS = Arrays.asList("localhost", "127.0.0.1", "10.0.2.2");

    private FileOpening() {}

    static boolean isAllowedUrl(String url) {
        if (url == null) {
            return false;
        }
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            return !host.isEmpty() && ("https".equals(scheme) || ("http".equals(scheme) && DEV_HOSTS.contains(host)));
        } catch (URISyntaxException e) {
            return false;
        }
    }

    static String safeName(String name) {
        String base = name == null ? "" : name.substring(Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')) + 1);
        String cleaned = base.replaceAll("[\\p{Cntrl}:*?\"<>|]", "_").trim().replaceAll("^\\.+", "");
        if (cleaned.length() > MAX_NAME_CHARS) {
            cleaned = cleaned.substring(cleaned.length() - MAX_NAME_CHARS);
        }
        return cleaned.isEmpty() ? "file" : cleaned;
    }

    static String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    static void copy(InputStream in, OutputStream out, long maxBytes) throws IOException {
        byte[] buffer = new byte[64 * 1024];
        long total = 0;
        for (int read = in.read(buffer); read != -1; read = in.read(buffer)) {
            total += read;
            if (total > maxBytes) {
                throw new IOException("The file is larger than " + maxBytes + " bytes");
            }
            out.write(buffer, 0, read);
        }
    }
}
