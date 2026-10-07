import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ArtifactCard from '../components/ArtifactCard';
import { Shield, Scan, CheckCircle, ArrowRight, Database, Search } from 'lucide-react';

const Landing = () => {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/cases');
        setFeatured(res.data.slice(0, 4));
      } catch (err) {
        console.error('Landing fetch error:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-slate-50 to-white border border-slate-200 p-8 md:p-16 text-center space-y-6 shadow-sm">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-widest">
          <Shield className="w-4 h-4 text-blue-600" /> National Antiquities Identity & Recovery Ecosystem
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black font-display tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Protecting India’s Cultural Heritage with <span className="text-blue-600">AI & Digital Passports</span>
        </h1>

        <p className="text-slate-600 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-sans">
          NexData unifies temples, museums, law enforcement (ASI/Police), and heritage experts to issue tamper-evident digital passports and run AI image identification for stolen antiquities.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/register"
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            Register Entity <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/search"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 font-semibold text-sm transition flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-blue-600" /> Search Registry
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-blue-300 transition shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Digital Passport & Provenance</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Multi-angle photo captures, dimensions, inscriptions, and complete ownership history registered securely for temples and museums.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-blue-300 transition shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Scan className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">AI Instant Matching Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Law enforcement uploads photos of recovered objects to instantly cross-reference against national stolen artifact databases with similarity scoring.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-blue-300 transition shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Expert Panel Verification</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            State-appointed archaeology experts review visual and micro-feature side-by-side comparisons before initiating official repatriation.
          </p>
        </div>
      </section>

      {/* Featured Registry Showcase */}
      {featured.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900">National Antiquities Registry Showcase</h2>
              <p className="text-xs text-slate-500">Live verified identities registered on the NexData Network</p>
            </div>
            <Link to="/search" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((artifact) => (
              <ArtifactCard key={artifact._id} artifact={artifact} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Landing;
