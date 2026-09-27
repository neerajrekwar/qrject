'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/portfolio/Navbar';
import { HeroSection } from '@/components/portfolio/HeroSection';
import { MarqueeBanner } from '@/components/portfolio/MarqueeBanner';
import { ProjectShowcase } from '@/components/portfolio/ProjectShowcase';
import { OpenSourceRegistry } from '@/components/portfolio/OpenSourceRegistry';
import { ServicesSection } from '@/components/portfolio/ServicesSection';
import { ContactBlock } from '@/components/portfolio/ContactBlock';
import { TechnicalFooter } from '@/components/portfolio/TechnicalFooter';
import { LiveArtifactModal } from '@/components/portfolio/LiveArtifactModal';

export default function Home() {
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);

  const handleOpenContact = () => {
    const contactElem = document.getElementById('contact');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExploreProjects = () => {
    const projectsElem = document.getElementById('projects');
    if (projectsElem) {
      projectsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExploreRegistry = () => {
    const registryElem = document.getElementById('registry');
    if (registryElem) {
      registryElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-sans selection:bg-[#ccff00] selection:text-black relative flex flex-col">
      
      {/* 1. TOP NAVIGATION BAR */}
      <Navbar
        onOpenContact={handleOpenContact}
        onOpenQRArtifact={() => setIsArtifactModalOpen(true)}
      />

      {/* MAIN CONTENT RUNTIME */}
      <main className="flex-1 w-full">
        {/* 2. HERO BLOCK */}
        <HeroSection
          onExploreProjects={handleExploreProjects}
          onExploreRegistry={handleExploreRegistry}
          onOpenQRArtifact={() => setIsArtifactModalOpen(true)}
        />

        {/* 3. HORIZONTAL TECH STACK MARQUEE */}
        <MarqueeBanner />

        {/* 4. PROJECT SHOWCASE GRID */}
        <ProjectShowcase onOpenQRArtifact={() => setIsArtifactModalOpen(true)} />

        {/* 5. OPEN-SOURCE REGISTRY MODULES */}
        <OpenSourceRegistry />

        {/* 6. CORE DISCIPLINES & SERVICES */}
        <ServicesSection
          onSelectService={() => {
            handleOpenContact();
          }}
        />

        {/* 7. INITIALIZE ENGAGEMENT CONTACT BLOCK */}
        <ContactBlock />
      </main>

      {/* 8. TECHNICAL FOOTER */}
      <TechnicalFooter onOpenQRArtifact={() => setIsArtifactModalOpen(true)} />

      {/* 9. INTERACTIVE LIVE ARTIFACT MODAL (300 DPI QR Studio & Pass Engine) */}
      <LiveArtifactModal
        isOpen={isArtifactModalOpen}
        onClose={() => setIsArtifactModalOpen(false)}
      />

    </div>
  );
}
