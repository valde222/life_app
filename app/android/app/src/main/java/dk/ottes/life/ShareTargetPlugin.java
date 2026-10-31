package dk.ottes.life;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {
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
        if (intent == null || !SharedContent.isShareAction(intent.getAction())) {
            return null;
        }
        JSObject share = new JSObject();
        share.put("text", SharedContent.cappedText(intent.getStringExtra(Intent.EXTRA_TEXT)));
        share.put("subject", SharedContent.cappedText(intent.getStringExtra(Intent.EXTRA_SUBJECT)));
        share.put("images", new SharedImages(getContext()).read(intent));
        intent.setAction(Intent.ACTION_MAIN);
        return share;
    }
}
