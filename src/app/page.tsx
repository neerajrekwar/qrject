'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/portfolio/Navbar';
import { HeroSection } from '@/components/portfolio/HeroSection';
import { MarqueeBanner } from '@/components/portfolio/MarqueeBanner';
import { ProjectShowcase } from '@/components/portfolio/ProjectShowcase';
import { OpenSourceRegistry } from '@/components/portfolio/OpenSourceRegistry';
import { ContactBlock } from '@/components/portfolio/ContactBlock';
import { TechnicalFooter } from '@/components/portfolio/TechnicalFooter';
import { LiveArtifactModal } from '@/components/portfolio/LiveArtifactModal';

export default function Home() {
  const [artifactModalOpen, setArtifactModalOpen] = useState(false);

  const scrollToContact = () => {
    const contactElem = document.getElementById('contact');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToProjects = () => {
    const projectsElem = document.getElementById('projects');
    if (projectsElem) {
      projectsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToRegistry = () => {
    const registryElem = document.getElementById('registry');
    if (registryElem) {
      registryElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black flex flex-col font-sans selection:bg-[#ccff00] selection:text-black">
      {/* 1. Top Navigation Bar */}
      <Navbar
        onOpenContact={scrollToContact}
        onOpenQRArtifact={() => setArtifactModalOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="flex-1 w-full flex flex-col">
        {/* 2. Hero Block */}
        <HeroSection
          onExploreProjects={scrollToProjects}
          onExploreRegistry={scrollToRegistry}
          onOpenQRArtifact={() => setArtifactModalOpen(true)}
        />

        {/* 3. Horizontal Tech Stack Marquee */}
        <MarqueeBanner />

        {/* 4. "Project Showcase" Grid */}
        <ProjectShowcase
          onOpenQRArtifact={() => setArtifactModalOpen(true)}
        />

        {/* 5. "Open-Source Registry" Modules */}
        <OpenSourceRegistry />

        {/* 6. "Initialize Engagement" Contact Block */}
        <ContactBlock />
      </main>

      {/* 7. Technical Footer */}
      <TechnicalFooter
        onOpenQRArtifact={() => setArtifactModalOpen(true)}
      />

      {/* Live Interactive Artifact Modal for QR Engine & Event Pass */}
      <LiveArtifactModal
        isOpen={artifactModalOpen}
        onClose={() => setArtifactModalOpen(false)}
      />
    </div>
  );
}
