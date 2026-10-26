import { IllustratedSection } from '../../core/components/IllustratedSection.jsx';
import { ContactForm } from './components/ContactForm.jsx';
import { ArrowDown } from 'lucide-react';

export const Contact = () => {
  const scrollToForm = () => {
    const formElement = document.getElementById('contact-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full text-left">
      <IllustratedSection image="/assets/contact-hero-bg.png" side="right" className="relative w-full min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] xl:min-h-[680px] bg-[#073c2d] text-white flex items-center px-6 sm:px-12 lg:px-20 overflow-hidden">

        <div className="illustrated-section__content max-w-7xl mx-auto w-full pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32 relative z-10">
          <div className="max-w-2xl select-none">
            {/* Small Tracker Tag */}
            <span className="text-xs sm:text-sm font-bold tracking-[0.25em] text-[#f4ebdc]/85 uppercase block mb-4 sm:mb-6 font-sans">
              CONTACT
            </span>

            {/* Main Headline: Let's talk. */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[112px] xl:text-[126px] font-black tracking-[-0.03em] leading-[0.9] text-white drop-shadow-sm font-sans">
              Let&apos;s<br />
              talk.
            </h1>

            {/* Paragraph Text */}
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl md:text-2xl text-[#f3ece0]/90 font-normal leading-relaxed max-w-md">
              Questions, thoughts, or just wondering where to begin? We&apos;d love to hear from you.
            </p>

            {/* Outlined Down Arrow Button (Smooth Scroll to Form) */}
            <div className="mt-8 sm:mt-12">
              <button
                type="button"
                onClick={scrollToForm}
                aria-label="Scroll down to contact form"
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border border-[#f3ece0]/50 hover:border-white hover:bg-white/10 flex items-center justify-center text-white transition-all cursor-pointer group"
              >
                <ArrowDown className="w-5 h-5 stroke-[1.75] group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </IllustratedSection>
      <section 
        id="contact-form"
        className="w-full bg-[#f4f2ea] py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative"
      >
        <ContactForm />
      </section>
    </div>
  );
};

export default Contact;
