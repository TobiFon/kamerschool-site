// src/components/home/TestimonialsSection.tsx
"use client";
import React, { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";
import TestimonialCard, { Testimonial } from "./TestimonialCard"; // Import new card
import { Swiper, SwiperSlide } from "swiper/react";
import {
  EffectCoverflow,
  Pagination,
  Autoplay,
  Navigation,
} from "swiper/modules";
import { ChevronLeft, ChevronRight, MessageSquareQuote } from "lucide-react";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Sample Testimonial Data (ensure paths are correct)
const testimonialsData: Testimonial[] = [
  {
    id: "1",
    quote:
      "Kamerschools has completely revolutionized how we manage student data and communicate with parents. The time saved on administrative tasks is incredible!",
    highlight: "Revolutionized our school management!",
    name: "Mrs. Amina Diallo",
    role: "Principal, Sunshine Academy",
    avatarSrc: "/images/avatars/amina-diallo.jpg",
    schoolLogoSrc: "/images/logos/sunshine-academy-logo.png",
    rating: 5,
    isVerified: true,
  },
  {
    id: "2",
    quote:
      "As a parent, I finally feel connected to my child's progress. The app is so easy to use, and I love the real-time updates on grades and attendance.",
    highlight: "Finally feel connected!",
    name: "Mr. Johnathan Lee",
    role: "Parent, Grade 8 Student",
    avatarSrc: "/images/avatars/john-lee.jpg",
    rating: 5,
    isVerified: true,
  },
  {
    id: "3",
    quote:
      "The analytics features are a game-changer. We can now identify learning trends and provide targeted support to students much more effectively.",
    highlight: "Analytics are a game-changer.",
    name: "Dr. Fatima Chen",
    role: "Academic Coordinator, Bright Minds Int'l",
    avatarSrc: "/images/avatars/fatima-chen.jpg",
    schoolLogoSrc: "/images/logos/bright-minds-logo.png",
    rating: 4.5,
  },
  {
    id: "4",
    quote:
      "Switching to Kamerschools was seamless. The support team was fantastic, and our staff adapted quickly. It's made our daily operations so much smoother.",
    highlight: "Seamless transition, smoother ops.",
    name: "Mr. David K.",
    role: "IT Admin, Future Leaders School",
    avatarSrc: "/images/avatars/david-k.jpg",
    rating: 5,
    isVerified: true,
  },
  {
    id: "5",
    quote:
      "The platform is intuitive and user-friendly. Our teachers picked it up in no time, and the reduction in paperwork is a relief for everyone.",
    highlight: "Intuitive and user-friendly!",
    name: "Ms. Sarah B.",
    role: "Lead Teacher, Oakwood Prep",
    // No avatar or logo for variety
    rating: 4,
  },
];

export default function TestimonialsSection() {
  const t = useTranslations("HomePage.Testimonials");
  const sectionRef = useRef(null);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Headline animations
  const headlineY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["15%", "0%", "-15%"]
  );
  const headlineOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0]
  );

  const headline = t("headline", {
    defaultValue: "Trusted by Educators & Parents Alike",
  });

  useEffect(() => {
    // Swiper's loop mode can sometimes mess with initial activeIndex.
    // This ensures we set it correctly after swiper initializes.
    if (swiperInstance) {
      setActiveIndex(swiperInstance.realIndex);
      swiperInstance.on("slideChange", () => {
        setActiveIndex(swiperInstance.realIndex);
      });
    }
  }, [swiperInstance]);

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-28 lg:py-32 
                 bg-gradient-to-b from-background via-slate-50 to-background 
                 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 
                 overflow-hidden"
    >
      {/* Background abstract shapes - softer, more atmospheric */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-2/5 h-2/5 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"
        style={{
          x: useTransform(scrollYProgress, [0, 1], ["-25%", "15%"]),
          y: useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]),
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-1/3 h-1/3 bg-secondary/10 dark:bg-secondary/15 rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"
        style={{
          x: useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]),
          y: useTransform(scrollYProgress, [0, 1], ["5%", "-15%"]),
        }}
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-12 md:mb-16"
          style={{ y: headlineY, opacity: headlineOpacity }}
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div
            className="inline-block mb-4 p-3.5 bg-primary/10 dark:bg-primary/20 rounded-full shadow-md"
            initial={{ scale: 0, rotate: -45 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 150,
              damping: 15,
              delay: 0.1,
            }}
            viewport={{ once: true }}
          >
            <MessageSquareQuote className="w-7 h-7 md:w-8 md:h-8 text-primary" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground dark:text-slate-100 leading-tight">
            {headline}
          </h2>
        </motion.div>

        <motion.div
          className="relative"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <Swiper
            onSwiper={setSwiperInstance}
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={"auto"}
            loop={testimonialsData.length > 3} // Loop if more than 3 slides for coverflow to look good
            autoplay={{ delay: 6000, disableOnInteraction: true }} // Slower autoplay
            coverflowEffect={{
              rotate: 25, // Rotation of side slides
              stretch: -15, // Negative stretch pulls slides closer - adjust for desired overlap
              depth: 120, // Depth of side slides
              modifier: 1, // Effect multiplier
              slideShadows: false, // Disable default shadows, we use custom on card
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
              el: ".swiper-pagination-custom", // Custom pagination element
            }}
            navigation={{
              nextEl: ".swiper-button-next-custom",
              prevEl: ".swiper-button-prev-custom",
            }}
            modules={[EffectCoverflow, Pagination, Autoplay, Navigation]}
            className="testimonial-swiper !pb-16 md:!pb-20" // More padding for custom pagination
            // onSlideChange is handled by useEffect above
            breakpoints={{
              320: {
                slidesPerView: 1.1,
                spaceBetween: 15,
                coverflowEffect: {
                  rotate: 0,
                  stretch: 0,
                  depth: 80,
                  modifier: 2,
                },
              },
              640: {
                slidesPerView: 1.8,
                spaceBetween: 20,
                coverflowEffect: {
                  rotate: 15,
                  stretch: -10,
                  depth: 100,
                  modifier: 1.2,
                },
              },
              1024: {
                slidesPerView: 2.5,
                spaceBetween: 25,
                coverflowEffect: {
                  rotate: 25,
                  stretch: -15,
                  depth: 120,
                  modifier: 1,
                },
              }, // Show 2.5 to hint at more
              1280: {
                slidesPerView: 3,
                spaceBetween: 30,
                coverflowEffect: {
                  rotate: 25,
                  stretch: -15,
                  depth: 120,
                  modifier: 1,
                },
              },
            }}
          >
            {testimonialsData.map((testimonial, index) => (
              <SwiperSlide
                key={testimonial.id}
                // Dynamic width for slides to control appearance in coverflow
                className="!w-[300px] xs:!w-[320px] sm:!w-[360px] md:!w-[400px] !h-auto self-stretch"
              >
                <TestimonialCard
                  testimonial={testimonial}
                  isActive={index === activeIndex}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons - Enhanced Styling */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-4 md:-left-5 z-20">
            <button
              className="swiper-button-prev-custom p-2.5 sm:p-3 bg-card/80 dark:bg-slate-800/60 hover:bg-primary hover:text-primary-foreground 
                         dark:hover:bg-primary text-foreground dark:text-slate-200 
                         rounded-full shadow-lg hover:shadow-primary/30 transition-all duration-300 
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card/80 disabled:hover:text-foreground"
              onClick={() => swiperInstance?.slidePrev()}
              disabled={
                swiperInstance?.isBeginning && !swiperInstance?.params.loop
              }
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-4 md:-right-5 z-20">
            <button
              className="swiper-button-next-custom p-2.5 sm:p-3 bg-card/80 dark:bg-slate-800/60 hover:bg-primary hover:text-primary-foreground 
                         dark:hover:bg-primary text-foreground dark:text-slate-200 
                         rounded-full shadow-lg hover:shadow-primary/30 transition-all duration-300
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card/80 disabled:hover:text-foreground"
              onClick={() => swiperInstance?.slideNext()}
              disabled={swiperInstance?.isEnd && !swiperInstance?.params.loop}
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Custom Pagination Container */}
          <div className="swiper-pagination-custom text-center mt-6 md:mt-8"></div>
        </motion.div>
      </div>
    </section>
  );
}
