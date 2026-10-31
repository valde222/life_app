package dk.ottes.life;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.File;
import javax.xml.parsers.DocumentBuilderFactory;
import org.junit.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

public class ManifestSecurityTest {
    private static final String ANDROID = "http://schemas.android.com/apk/res/android";

    private static Document read(String path) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        return factory.newDocumentBuilder().parse(new File(path));
    }

    private static Element application() throws Exception {
        return (Element) read("src/main/AndroidManifest.xml").getElementsByTagName("application").item(0);
    }

    @Test
    public void keepsAppDataOutOfBackups() throws Exception {
        Element application = application();
        assertEquals("false", application.getAttributeNS(ANDROID, "allowBackup"));
        assertEquals("false", application.getAttributeNS(ANDROID, "fullBackupContent"));
        assertEquals("@xml/data_extraction_rules", application.getAttributeNS(ANDROID, "dataExtractionRules"));
        Document rules = read("src/main/res/xml/data_extraction_rules.xml");
        for (String section : new String[] {"cloud-backup", "device-transfer"}) {
            Element element = (Element) rules.getElementsByTagName(section).item(0);
            NodeList excluded = element.getElementsByTagName("exclude");
            assertEquals(section, 5, excluded.getLength());
        }
    }

    @Test
    public void releaseBuildsRefuseCleartext() throws Exception {
        assertEquals("@xml/network_security_config", application().getAttributeNS(ANDROID, "networkSecurityConfig"));
        Element base = (Element) read("src/main/res/xml/network_security_config.xml")
            .getElementsByTagName("base-config").item(0);
        assertEquals("false", base.getAttribute("cleartextTrafficPermitted"));
        assertFalse(new File("src/main/res/xml/network_security_config.xml").length() == 0);
    }

    @Test
    public void debugBuildsAllowCleartextOnlyToThisMachine() throws Exception {
        Document debug = read("src/debug/res/xml/network_security_config.xml");
        Element base = (Element) debug.getElementsByTagName("base-config").item(0);
        assertEquals("false", base.getAttribute("cleartextTrafficPermitted"));
        NodeList domains = debug.getElementsByTagName("domain");
        for (int index = 0; index < domains.getLength(); index++) {
            String domain = domains.item(index).getTextContent().trim();
            assertTrue(domain, domain.equals("localhost") || domain.equals("127.0.0.1") || domain.equals("10.0.2.2"));
        }
        assertFalse(new File("src/debug/AndroidManifest.xml").exists());
    }
}
