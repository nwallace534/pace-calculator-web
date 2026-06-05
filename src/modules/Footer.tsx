import { useTranslation } from "react-i18next";
import IconGithub from "@/assets/icon-github.svg?react";
import IconMail from "@/assets/icon-mail.svg?react";

const GITHUB_URL = "https://github.com/nwallace534/pace-calculator-web";
const CONTACT_EMAIL = "hello@pacerly.com";
const AUTHOR_NAME = "Nicholas Wallace";

const ICON_STYLE = { verticalAlign: "-2px" };

function Footer() {
  const { t } = useTranslation("footer");

  return (
    <footer className="text-center small pt-2 pb-4">
      <div className="text-muted">
        {t("builtBy", { name: AUTHOR_NAME })}
        {" · "}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          <IconGithub
            width="14"
            height="14"
            className="me-1"
            style={ICON_STYLE}
          />
          {t("sourceOnGitHub")}
        </a>
        {" · "}
        <a href={`mailto:${CONTACT_EMAIL}`}>
          <IconMail
            width="14"
            height="14"
            className="me-1"
            style={ICON_STYLE}
          />
          {CONTACT_EMAIL}
        </a>
      </div>
    </footer>
  );
}

export default Footer;
