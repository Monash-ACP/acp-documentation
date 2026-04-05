// src/components/TeamMember.js

import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

// Define the component and accept props for content
export default function TeamMember({ name, title, description, image, socialLink }) {
  // Use a sensible default image if none is provided
  const imgPath = useBaseUrl(image || '/img/docusaurus.png');

  return (
    <div style={{
      textAlign: 'center',
      maxWidth: '250px',
      padding: '15px',
      border: '1px solid var(--ifm-color-emphasis-200)', // Using Docusaurus variable for better theme integration
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
      margin: '10px',
    }}>
      <img
        src={imgPath}
        alt={name}
        style={{
          borderRadius: '50%',
          width: '150px',
          height: '150px',
          objectFit: 'cover',
          marginBottom: '10px',
        }}
      />
      <h3>{name}</h3>
      <p style={{ margin: '0 0 10px 0', color: 'var(--ifm-color-emphasis-700)', fontWeight: 'bold' }}>
        {title}
      </p>
      <p style={{ fontSize: '0.9em' }}>{description}</p>
      {socialLink && (
        <a href={socialLink} target="_blank" rel="noopener noreferrer">
          Connect
        </a>
      )}
    </div>
  );
}
