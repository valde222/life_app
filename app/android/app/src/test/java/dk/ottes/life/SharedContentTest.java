package dk.ottes.life;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class SharedContentTest {
    private static final String APP = "dk.ottes.life";

    @Test
    public void acceptsImagesFromOtherApps() {
        assertTrue(SharedContent.isReadableImage("content", "com.google.android.apps.photos.contentprovider", "image/jpeg", APP));
    }

    @Test
    public void refusesFilePaths() {
        assertFalse(SharedContent.isReadableImage("file", "", "image/png", APP));
        assertFalse(SharedContent.isReadableImage("FILE", null, "image/png", APP));
        assertFalse(SharedContent.isReadableImage(null, null, "image/png", APP));
    }

    @Test
    public void refusesTheAppsOwnProviders() {
        assertFalse(SharedContent.isReadableImage("content", "dk.ottes.life.fileprovider", "image/png", APP));
        assertFalse(SharedContent.isReadableImage("content", "dk.ottes.life", "image/png", APP));
    }

    @Test
    public void refusesWhatIsNotAnImage() {
        assertFalse(SharedContent.isReadableImage("content", "media", "text/html", APP));
        assertFalse(SharedContent.isReadableImage("content", "media", null, APP));
    }

    @Test
    public void capsSharedText() {
        assertEquals(null, SharedContent.cappedText(null));
        assertEquals("short", SharedContent.cappedText("short"));
        assertEquals(SharedContent.MAX_TEXT_CHARS, SharedContent.cappedText("x".repeat(SharedContent.MAX_TEXT_CHARS + 5)).length());
    }

    @Test
    public void readsImagesUpToTheCap() throws java.io.IOException {
        byte[] small = new byte[10];
        assertArrayEquals(small, SharedContent.readCapped(new java.io.ByteArrayInputStream(small), 10));
        assertNull(SharedContent.readCapped(new java.io.ByteArrayInputStream(new byte[11]), 10));
    }

    @Test
    public void onlySendIntentsAreShares() {
        assertTrue(SharedContent.isShareAction("android.intent.action.SEND"));
        assertTrue(SharedContent.isShareAction("android.intent.action.SEND_MULTIPLE"));
        assertFalse(SharedContent.isShareAction("android.intent.action.MAIN"));
        assertFalse(SharedContent.isShareAction(null));
    }
}

