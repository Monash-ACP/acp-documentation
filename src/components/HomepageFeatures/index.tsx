import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Documentation',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Welcome! We're consolidating the documentation of services provided by
        eResearch. You'll find information on how to access and use our services, as
        well as where to go for help when you need it:
        <ul>
          <li>M3</li>
          <li>MonARCH</li>
          <li>RDS</li>
          <li>More coming soon</li>
        </ul>
      </>
    ),
  },
  {
    title: 'eResearch Training',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        By collaborating with world-leading technology partners and national
        research infrastructure providers, we equip researchers with new tools and
        practices, and fast-track industry's ability to bring new technologies to
        the market.
      </>
    ),
  },
  {
    title: 'Capabilities',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        We provide advanced data storage, high-performance computing and
        expertise for data processing, modelling and simulation, collaboration
        platforms, and communication capabilities to disseminate research
        data.
      </>
    ),
  },
  {
    title: 'Accelerating Progress',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Monash eResearch is accelerating progress by applying advanced
        computing and information technology to important research problems, and by
        partnering with Australian and global research communities.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--3')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
