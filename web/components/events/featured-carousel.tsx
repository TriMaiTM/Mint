"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface EventTier {
  price: unknown;
}

interface FeaturedEvent {
  id: string;
  title: string;
  bannerImage: string | null;
  startDate: Date;
  venue: string | null;
  category: string | null;
  ticketTiers: EventTier[];
}

interface FeaturedCarouselProps {
  events: FeaturedEvent[];
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  music: "linear-gradient(135deg, #FF0844 0%, #FFB199 100%)",
  tech: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
  food: "linear-gradient(135deg, #F83600 0%, #FE9F00 100%)",
  sports: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  art: "linear-gradient(135deg, #b00979 0%, #ff5252 100%)",
  business: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
  general: "linear-gradient(135deg, #434343 0%, #000000 100%)",
};

function getBackgroundStyle(event: FeaturedEvent) {
  if (event.bannerImage) {
    return { backgroundImage: `url(${event.bannerImage})` };
  }
  const cat = (event.category || "general").toLowerCase();
  const grad = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.general;
  return { background: grad };
}

function formatDate(dateInput: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateInput));
}

function lowestPrice(tiers: EventTier[]) {
  if (!tiers.length) return null;
  const num = Number(tiers[0].price);
  return isNaN(num) ? null : `$${num.toFixed(2)}`;
}

export function FeaturedCarousel({ events }: FeaturedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % events.length);
    }, 5000);
  };

  useEffect(() => {
    if (events.length > 1) {
      resetTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [events.length]);

  if (!events.length) {
    return (
      <div className="featured-carousel-section">
        <div className="featured-carousel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p className="text-body-md text-muted">No featured events available</p>
        </div>
      </div>
    );
  }

  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + events.length) % events.length);
    resetTimer();
  };

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % events.length);
    resetTimer();
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    resetTimer();
  };

  return (
    <div className="featured-carousel-section">
      <div className="featured-carousel">
        {events.map((event, index) => {
          const isActive = index === activeIndex;
          const bgStyle = getBackgroundStyle(event);
          const priceStr = lowestPrice(event.ticketTiers);

          return (
            <div
              key={event.id}
              className={`carousel-slide ${isActive ? "active" : ""}`}
            >
              <div className="carousel-bg-image" style={bgStyle} />
              <div className="carousel-overlay" />
              
              <div className="carousel-content">
                <span className="carousel-content-badge">
                  Featured · {event.category || "General"}
                </span>
                
                <h2 className="carousel-content-title">{event.title}</h2>

                
                <Link
                  href={`/events/${event.id}`}
                  className="btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-xs)",
                    marginTop: "var(--space-xs)",
                    boxShadow: "0 4px 16px rgba(230, 0, 35, 0.4)",
                  }}
                >
                  Get Tickets
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </div>
          );
        })}

        {/* Arrows */}
        {events.length > 1 && (
          <>
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={handlePrev}
              aria-label="Previous Slide"
              style={{ border: "none" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={handleNext}
              aria-label="Next Slide"
              style={{ border: "none" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {events.length > 1 && (
          <div className="carousel-dots">
            {events.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === activeIndex ? "active" : ""}`}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to slide ${index + 1}`}
                style={{ border: "none" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
