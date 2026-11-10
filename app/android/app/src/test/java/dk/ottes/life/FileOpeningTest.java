package dk.ottes.life;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.junit.Test;

public class FileOpeningTest {
    @Test
    public void downloadsOnlyOverHttpsOrFromTheDevServer() {
        assertTrue(FileOpening.isAllowedUrl("https://life.tail1234.ts.net/api/files/notes/a/b.pdf?token=x"));
        assertTrue(FileOpening.isAllowedUrl("http://localhost:8090/api/files/notes/a/b.pdf"));
        assertTrue(FileOpening.isAllowedUrl("http://10.0.2.2:8090/api/files/notes/a/b.pdf"));
        assertFalse(FileOpening.isAllowedUrl("http://life.tail1234.ts.net/b.pdf"));
        assertFalse(FileOpening.isAllowedUrl("file:///data/data/dk.ottes.life/databases/x"));
        assertFalse(FileOpening.isAllowedUrl("content://dk.ottes.life.fileprovider/x"));
        assertFalse(FileOpening.isAllowedUrl("https:///no-host"));
        assertFalse(FileOpening.isAllowedUrl("not a url"));
        assertFalse(FileOpening.isAllowedUrl(null));
    }

    @Test
    public void keepsReadableNames() {
        assertEquals("Lejekontrakt Æblegrød.pdf", FileOpening.safeName("Lejekontrakt Æblegrød.pdf"));
    }

    @Test
    public void namesCannotLeaveTheFolder() {
        assertEquals("passwd", FileOpening.safeName("../../etc/passwd"));
        assertEquals("evil.exe", FileOpening.safeName("..\\..\\evil.exe"));
        assertEquals("hidden", FileOpening.safeName("...hidden"));
        assertEquals("a_b_.txt", FileOpening.safeName("a:b?.txt"));
        assertEquals("file", FileOpening.safeName(".."));
        assertEquals("file", FileOpening.safeName(null));
    }

    @Test
    public void readsTheExtension() {
        assertEquals("pdf", FileOpening.extensionOf("Rapport.PDF"));
        assertEquals("", FileOpening.extensionOf("README"));
    }

    @Test
    public void stopsAFileThatGrowsPastTheLimit() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        FileOpening.copy(new ByteArrayInputStream(new byte[10]), out, 10);
        assertEquals(10, out.size());
        assertThrows(IOException.class, () -> FileOpening.copy(new ByteArrayInputStream(new byte[11]), new ByteArrayOutputStream(), 10));
    }
}
