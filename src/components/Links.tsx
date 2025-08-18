import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function RegistrationURL({ children }) {
  const {siteConfig} = useDocusaurusContext();
  return (
    <a href={siteConfig.customFields.registrationURL}>
      {children}
    </a>
  );
}
