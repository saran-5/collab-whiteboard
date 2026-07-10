// Reserved space for a future Google AdSense unit.
// Intentionally NOT wired up to any real ad service.
import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <div className="ad-banner">
      <ins
        className="adsbygoogle"
         style={{
      display: "block",
      width: "50%",
      height: "90px"
    }}
        data-ad-client="ca-pub-5868162591985814"
        data-ad-slot="7037197547"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}