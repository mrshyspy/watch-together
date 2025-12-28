import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion';
import { Play, Users, List, Zap, Lock, Globe, ArrowRight, Sparkles, Crown, Video } from 'lucide-react';
// import { createRoom } from '../utils/createRoom';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useRef } from "react";



const WatchTogetherLanding = () => {
  const navigate = useNavigate();
  const featuresRef = useRef(null);


  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const createRoom = () => {
    const newRoomId = uuidv4();
    localStorage.removeItem('currentUser');
    navigate(`/room/${newRoomId}/join`);
  };

  const joinRoom = () => {
    navigate('/join');
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="bg-black text-white min-h-screen overflow-hidden relative">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20 pointer-events-none" />

      {/* Cursor Glow Effect */}
      <motion.div
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.32) 0%, transparent 70%)',
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                SyncTube
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4"
            >
              <button onClick={scrollToFeatures}
                className="px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">
                Features
              </button>
              <button onClick={joinRoom}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 transition-all">
                Get Started
              </button>
            </motion.div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center relative px-6 pt-20">
          <motion.div style={{ opacity }} className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </motion.div>

          <div className="max-w-6xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Real-time synchronized streaming</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Watch Together.
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Perfectly Synced.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto mb-32"
            >
              Real-time YouTube watch rooms with playlists, cohost controls, and zero lag.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center   "
            >
              <button onClick={createRoom}
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 transform">
                Create Room
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={joinRoom}
                className="px-8 py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all font-semibold hover:scale-105 transform">
                Join Room
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-2"
            >
              <motion.div className="w-1.5 h-1.5 rounded-full bg-white" />
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="py-32 px-6 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-gray-400 text-lg">Three simple steps to start watching together</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Crown, title: 'Create a Room', desc: 'Become the cohost and control the experience', color: 'from-purple-500 to-pink-500' },
                { icon: List, title: 'Add YouTube Videos', desc: 'Build your perfect playlist with ease', color: 'from-cyan-500 to-blue-500' },
                { icon: Users, title: 'Watch in Sync', desc: 'Guests follow perfectly in real-time', color: 'from-purple-500 to-cyan-500' }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" style={{ background: `linear-gradient(to right, ${step.color})` }} />
                  <div className="relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-6`}>
                      <step.icon className="w-8 h-8" />
                    </div>
                    <div className="text-4xl font-bold text-white/20 mb-4">{String(i + 1).padStart(2, '0')}</div>
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-gray-400">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section ref={featuresRef}
        className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Powerful Features
              </h2>
              <p className="text-gray-400 text-lg">Everything you need for the perfect watch party</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Play, title: 'Real-Time Sync', desc: 'Play, pause, and seek in perfect harmony across all viewers', color: 'purple' },
                { icon: Crown, title: 'Cohost & Guest Roles', desc: 'Clear role separation with smart permission controls', color: 'cyan' },
                { icon: List, title: 'Smart Playlist', desc: 'Queue management with auto-loop and next video support', color: 'pink' },
                { icon: Zap, title: 'WebSocket Powered', desc: 'Lightning-fast real-time updates with zero lag', color: 'blue' },
                { icon: Lock, title: 'Guest Protection', desc: 'Interaction disabled for guests ensures smooth playback', color: 'purple' },
                { icon: Globe, title: 'No Downloads', desc: 'Works instantly in any modern browser', color: 'cyan' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="group relative"
                >
                  <div className={`absolute inset-0 bg-${feature.color}-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-all h-full">
                    <feature.icon className={`w-10 h-10 mb-4 text-${feature.color}-400`} />
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-32 px-6 relative">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Built With Modern Tech
              </h2>
              <p className="text-gray-400 text-lg">Powered by industry-leading technologies</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-4"
            >
              {['React', 'Node.js', 'Socket.IO', 'YouTube API', 'MongoDB', 'Tailwind CSS'].map((tech, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-white/10 backdrop-blur-sm hover:border-white/30 transition-all"
                >
                  <span className="font-semibold text-white">{tech}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 relative">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative p-12 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Start watching together in seconds
                </h2>
                <p className="text-gray-400 text-lg mb-8">
                  No sign-up required. Create a room and share the code instantly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={createRoom}
                  className="group px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 transition-all font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 transform">
                    Create Room
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={joinRoom}
                   className="px-10 py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all font-bold text-lg hover:scale-105 transform">
                    Join via Code
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <span className="font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                SyncTube
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              © 2025 SyncTube. Built with passion for synchronized streaming.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default WatchTogetherLanding;
