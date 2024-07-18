/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use client";
import { useEffect, useRef, useState } from "react";
import { GiFastForwardButton } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import ReactPlayer from 'react-player';

interface Hotspot {
  timestamp: number;
  productId: string;
  position: { x: number; y: number };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface Video {
  videoUrl: string;
  hotspots: {
    timestamp: number;
    description: string;
    productId: string;
    position: {
      x: number;
      y: number;
    };
  }[];
}

export default function HomePage() {
  const videoRef = useRef<ReactPlayer>(null);
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [productModal, setProductModal] = useState<Product | null>(null);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [videoMetadata, setVideoMetadata] = useState<Video>();
  const [productsData, setProductsData] = useState<Product[]>([]);

  const getVideoMetadata = async () => {
    try {
      const res = await fetch('/api/get-video-metadata');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const text = await res.json();
      setProductsData(text.products);
      setVideoMetadata(text.videoMetadata);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    getVideoMetadata();
  }, []);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        const current = Math.floor(videoRef.current.getCurrentTime());
        setCurrentTime(current);

        const activeHotspot = videoMetadata?.hotspots.find(h => current >= h.timestamp && current < h.timestamp + 10);
        if (activeHotspot) {
          const product = productsData.find(p => p.id === activeHotspot.productId);
          if (product) setActiveProduct(product);
        } else {
          setActiveProduct(null);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [videoMetadata, productsData]); // Add dependencies

  const handleHotspotClick = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.seekTo(timestamp, 'seconds');
      setTimeout(() => {
        videoRef.current?.getInternalPlayer()?.play();
      }, 100);
      setShowHotspotModal(false);
    }
  };

  const handleReady = () => {
    setIsPlayerLoaded(true);
  };

  const handleProductClick = (product: Product) => {
    setProductModal(product);
  };

  const closeProductModal = () => {
    setProductModal(null);
  };

  const closeHotspotModal = () => {
    setShowHotspotModal(false);
  };

  if (!hasMounted) return null;

  return (
    <main className="flex min-h-screen h-auto overflow-auto flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 md:px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-center text-white sm:text-[5rem]">
          Shoppable <span className="text-[hsl(280,100%,70%)]">Video</span> Platform
        </h1>
        <div className="relative flex justify-center">
          <ReactPlayer
            ref={videoRef}
            width={screenWidth < 768 ? "90%" : "850px"}
            height="100%"
            url={videoMetadata?.videoUrl}
            muted
            playing
            controls
            onReady={handleReady}
          />
          {isPlayerLoaded && !showHotspotModal && (
            <button
              className="absolute top-4 right-8 z-10 p-2 bg-black bg-opacity-50 text-white border-none rounded cursor-pointer"
              onClick={() => setShowHotspotModal(true)}
            >
              <GiFastForwardButton size={24} />
            </button>
          )}
          {showHotspotModal && (
            <div className="absolute flex w-full flex-wrap h-full top-0 left-0 justify-center items-center gap-2 z-10 p-2 bg-black bg-opacity-90 text-white rounded">
              <button
                className="absolute top-4 right-4 z-20 p-2 text-white"
                onClick={closeHotspotModal}
              >
                <IoClose size={24} />
              </button>
              <div className="flex flex-wrap justify-center gap-2">
                {videoMetadata?.hotspots.map((hotspot, index) => (
                  <div
                    key={index}
                    className="cursor-pointer bg-white/90 text-black p-2 rounded-xl flex flex-col items-center"
                    onClick={() => handleHotspotClick(hotspot.timestamp)}
                  >
                    <div className="text-base font-medium">{hotspot.description}</div>
                    <div className="text-xl font-bold">
                      {`${Math.floor(hotspot.timestamp / 60)}:${('0' + (hotspot.timestamp % 60)).slice(-2)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeProduct && (
            <div
              className="absolute cursor-pointer p-2 bg-white rounded shadow-lg text-black"
              style={{
                top: screenWidth < 768 ? '16px' : `${(videoMetadata?.hotspots.find(h => h.productId === activeProduct.id)?.position.y || 0) * (window.innerHeight / 800)}px`,
                left: screenWidth < 768 ? '36px' : `${(videoMetadata?.hotspots.find(h => h.productId === activeProduct.id)?.position.x || 0) * (window.innerWidth / 1200)}px`
              }}
              onClick={() => handleProductClick(activeProduct)}
            >
              <img src={activeProduct.image} alt={activeProduct.name} className="md:w-16 md:h-16 h-10 w-full object-cover rounded" />
              <div className="text-sm md:text-base">{activeProduct.name}</div>
              <div className="text-sm md:text-base">${activeProduct.price.toFixed(2)}</div>
            </div>
          )}
        </div>
        {productModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-30">
            <div className="bg-white p-4 w-1/3 rounded shadow-lg text-black relative">
              <button
                onClick={closeProductModal}
                className="absolute top-1 right-1 z-20 p-2 text-black"
              >
                <IoClose size={24} />
              </button>
              <h2 className="text-xl font-bold mb-2">{productModal.name}</h2>
              <img src={productModal.image} alt={productModal.name} className="mb-2 w-full h-64 object-cover" />
              <p>{productModal.description}</p>
              <p className="mt-2 font-bold">${productModal.price.toFixed(2)}</p>
              <button className="w-full bg-blue-500 rounded-lg flex justify-center items-center py-2 mt-2 text-white font-semibold">Buy Now</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
