import useDocusaurusContext from '@docusaurus/useDocusaurusContext';


function ConfigLink({
  field,
  children
}: {
  field: keyof any;
  children: React.ReactNode;
}) {
  const { siteConfig } = useDocusaurusContext();
  const url = siteConfig.customFields[field] as string;

  return <a href={url}>{children}</a>
}

export function ILabURL({ children }: { chilren: React.ReactNode }) {
  const { siteConfig } = useDocusaurusContext();
  return (
    <ConfigLink field="iLabURL">
      {children}
    </ConfigLink>
  );
}
