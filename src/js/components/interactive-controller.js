export class CustomSliderController {
    constructor(slider) {
        this.slider = slider;
        this.wrapper = this.slider.querySelector('.slider-wrapper');
        this.slides = Array.from(this.wrapper.querySelectorAll('.slider-slide'));
        this.totalSlides = this.slides.length;

        // Parse breadcrumbs
        this.breakpoints = JSON.parse(this.slider.dataset.breakpoints || '{}');
        this.defaultSpv = parseInt(this.slider.dataset.defaultSpv, 10) || 1;
        
        // Autoplay & Infinite State
        this.autoplayType = this.slider.dataset.autoplay || 'none';
        this.autoplayDelay = parseInt(this.slider.dataset.delay, 10) || 3000;
        this.continuousSpeed = parseInt(this.slider.dataset.speed, 10) || 100;
        this.isInfinite = this.slider.dataset.infinite === 'true';
        this.originalLength = parseInt(this.slider.dataset.originalLength, 10) || this.totalSlides;
        
        // Read interactive toggles
        this.isDraggable = this.slider.dataset.draggable === 'true';
        this.pauseOnHover = this.slider.dataset.pauseOnHover === 'true';

        this.viewportMap = { mobile: 768, tablet: 1024, laptop: 1366, desktop: 1920, large: 2560 };

        this.currentSpv = this.defaultSpv;
        this.slideWidth = 0;
        this.gapPx = 0;
        
        // HYDRATION
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.wrapper.style.transform = `translate3d(0px, 0, 0)`;
        
        this.currentIndex = this.isInfinite ? this.defaultSpv : 0; 
        
        this.isDragging = false;
        this.isHovering = false;
        this.isProcessingClick = false; 
        this.startX = 0;
        
        this.autoplayTimer = null;
        this.animationFrame = null;
        this.lastFrameTime = null;

        requestAnimationFrame(() => this.init());
    }

    init() {
        if (this.totalSlides === 0) return;
        this.handleResize(); 
        this.bindEvents();
        
        if (this.autoplayType === 'continuous') {
            const slideWidthTotal = this.slideWidth + this.gapPx;
            if (slideWidthTotal > 0) {
                this.currentIndex = Math.round((-this.currentTranslate - (this.currentSpv - 1) / 2 * this.gapPx) / slideWidthTotal);
            }
        }
        
        if (this.autoplayType !== 'none') {
            this.startAutoplay();
        }
    }

    bindEvents() {
        const prevBtn = this.slider.querySelector('.slider-nav-prev');
        const nextBtn = this.slider.querySelector('.slider-nav-next');
        if (prevBtn) prevBtn.addEventListener('click', () => this.manualNavigate(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.manualNavigate(1));

        const paginationDots = this.slider.querySelectorAll('.slider-pagination .icon');
        paginationDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (this.isProcessingClick) return;
                this.isProcessingClick = true;

                this.stopAutoplay();
                const targetIndex = this.isInfinite ? index + this.currentSpv : index;
                this.goToSlide(targetIndex);
                
                setTimeout(() => {
                    this.isProcessingClick = false;
                    this.resumeAutoplay();
                }, 300);
            });
        });

        this.resizeObserver = new ResizeObserver(this.debounce(() => this.handleResize(), 100));
        this.resizeObserver.observe(this.slider);

        if (this.isDraggable) {
            this.wrapper.addEventListener('pointerdown', (e) => this.pointerDown(e));
            this.wrapper.addEventListener('pointermove', (e) => this.pointerMove(e));
            this.wrapper.addEventListener('pointerup', (e) => this.pointerUp(e));
            this.wrapper.addEventListener('pointercancel', (e) => this.pointerUp(e));
        }

        // Hover logic strictly obeys pauseOnHover boolean
        this.slider.addEventListener('mouseenter', () => {
            if (this.pauseOnHover === true) {
                this.isHovering = true;
                this.stopAutoplay();
            }
        });
        this.slider.addEventListener('mouseleave', () => {
            if (this.pauseOnHover === true) {
                this.isHovering = false;
                this.resumeAutoplay();
            }
        });
    }

    handleResize() {
        const width = window.innerWidth;
        let newSpv = this.defaultSpv;
        const sortedBreakpoints = Object.entries(this.viewportMap).sort((a, b) => a[1] - b[1]);
        
        for (const [name, maxWidth] of sortedBreakpoints) {
            if (width <= maxWidth) {
                newSpv = this.breakpoints[name] || this.defaultSpv;
                break;
            }
        }

        this.currentSpv = newSpv;
        this.slideWidth = this.slider.clientWidth / this.currentSpv;
        this.gapPx = parseFloat(window.getComputedStyle(this.wrapper).columnGap) || 0;

        this.wrapper.style.setProperty('--slider-columns', `repeat(${this.totalSlides}, ${100 / this.currentSpv}%)`);
        
        if (this.autoplayType !== 'continuous' || !this.animationFrame) {
            this.updateSliderPosition(false); 
        }
    }

    startAutoplay() {
        if (this.autoplayType === 'interval') {
            this.autoplayTimer = setInterval(() => this.navigate(1), this.autoplayDelay);
        } else if (this.autoplayType === 'continuous') {
            this.wrapper.style.transition = 'none';
            this.lastFrameTime = performance.now();
            this.animationFrame = requestAnimationFrame((time) => this.continuousScroll(time));
        }
    }

    stopAutoplay() {
        if (this.autoplayTimer) clearInterval(this.autoplayTimer);
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.autoplayTimer = null;
        this.animationFrame = null;
        this.lastFrameTime = null;
    }

    resumeAutoplay() {
        if (this.autoplayType !== 'none' && !this.isHovering && !this.isDragging) {
            this.startAutoplay();
        }
    }

    continuousScroll(timestamp) {
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        if (this.slideWidth <= 0) {
            this.animationFrame = requestAnimationFrame((time) => this.continuousScroll(time));
            return;
        }

        const pixelsPerFrame = this.continuousSpeed * deltaTime;
        this.currentTranslate -= pixelsPerFrame;

        if (this.isInfinite) {
            const totalWidth = this.originalLength * (this.slideWidth + this.gapPx);
            const minTranslate = -totalWidth + this.slideWidth;
            
            if (this.currentTranslate < minTranslate) {
                this.currentTranslate += totalWidth;
            }
        } else {
            const maxIndex = Math.max(0, this.totalSlides - this.currentSpv);
            const addition = (this.currentSpv - 1) / 2;
            const minTranslate = -maxIndex * this.slideWidth - (maxIndex + addition) * this.gapPx;

            if (this.currentTranslate <= minTranslate) {
                this.currentTranslate = minTranslate;
                this.wrapper.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
                this.stopAutoplay();
                return; 
            }
        }

        this.prevTranslate = this.currentTranslate;
        this.wrapper.style.transition = 'none';
        this.wrapper.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
        
        const slideWidthTotal = this.slideWidth + this.gapPx;
        if (slideWidthTotal > 0) {
            this.currentIndex = Math.round((-this.currentTranslate - (this.currentSpv - 1) / 2 * this.gapPx) / slideWidthTotal);
        }
        this.updatePaginationUI();

        this.animationFrame = requestAnimationFrame((time) => this.continuousScroll(time));
    }

    manualNavigate(direction) {
        if (this.isProcessingClick) return;
        this.isProcessingClick = true;

        this.stopAutoplay();
        this.navigate(direction);
        
        setTimeout(() => {
            this.isProcessingClick = false;
            this.resumeAutoplay();
        }, 300);
    }

    navigate(direction) {
        let newIndex = this.currentIndex + direction;

        if (this.isInfinite) {
            const minIndex = this.currentSpv; 
            const maxIndex = this.currentSpv + this.originalLength;
            
            this.currentIndex = newIndex;
            this.updateSliderPosition(true);

            setTimeout(() => {
                if (this.currentIndex >= maxIndex) {
                    this.currentIndex -= this.originalLength;
                    this.updateSliderPosition(false); 
                } else if (this.currentIndex < minIndex) {
                    this.currentIndex += this.originalLength;
                    this.updateSliderPosition(false);
                }
            }, 300); 
            
        } else {
            const maxIndex = Math.max(0, this.totalSlides - this.currentSpv);
            this.currentIndex = Math.max(0, Math.min(newIndex, maxIndex));
            this.updateSliderPosition(true);
        }
    }

    goToSlide(index) {
        this.currentIndex = index;
        this.updateSliderPosition(true);
    }

    updateSliderPosition(useTransition = true) {
        if (this.autoplayType === 'continuous' && this.animationFrame !== null) return; 

        const addition = (this.currentSpv - 1) / 2;
        this.currentTranslate = -this.currentIndex * this.slideWidth - (this.currentIndex + addition) * this.gapPx;
        this.prevTranslate = this.currentTranslate;

        this.wrapper.style.transition = useTransition ? 'transform 0.3s ease-out' : 'none';
        this.wrapper.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
        
        this.updatePaginationUI();
    }

    updatePaginationUI() {
        const dots = this.slider.querySelectorAll('.slider-pagination .icon');
        if (!dots.length) return;

        let logicalIndex = this.isInfinite 
            ? (this.currentIndex - this.currentSpv + this.originalLength) % this.originalLength 
            : this.currentIndex;

        dots.forEach((dot, index) => {
            // Nuke legacy opacity artifacts baked into the HTML from older builds
            dot.style.opacity = '';

            const isActive = index === logicalIndex;
            
            if (isActive) {
                dot.classList.add('is-active');
            } else {
                dot.classList.remove('is-active');
            }
        });
    }

    pointerDown(e) {
        this.stopAutoplay();
        this.isDragging = true;
        this.startX = e.clientX;
        this.wrapper.style.transition = 'none'; 
        this.wrapper.classList.add('dragging');
        e.target.setPointerCapture(e.pointerId);
    }

    pointerMove(e) {
        if (!this.isDragging) return;
        const movedX = e.clientX - this.startX;
        this.currentTranslate = this.prevTranslate + movedX;

        if (!this.isInfinite) {
            const maxIndex = Math.max(0, this.totalSlides - this.currentSpv);
            const addition = (this.currentSpv - 1) / 2;
            const minTranslate = -maxIndex * this.slideWidth - (maxIndex + addition) * this.gapPx;
            const maxTranslate = 0;
            this.currentTranslate = Math.max(minTranslate, Math.min(this.currentTranslate, maxTranslate));
        }

        this.wrapper.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
    }

    pointerUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.wrapper.classList.remove('dragging');
        if (e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);

        if (this.autoplayType === 'continuous') {
            const slideWidthTotal = this.slideWidth + this.gapPx;
            if (slideWidthTotal > 0) {
                this.currentIndex = Math.round((-this.currentTranslate - (this.currentSpv - 1) / 2 * this.gapPx) / slideWidthTotal);
                
                if (!this.isInfinite) {
                    const maxIndex = Math.max(0, this.totalSlides - this.currentSpv);
                    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
                }
            }

            this.prevTranslate = this.currentTranslate;
            this.resumeAutoplay();
            return;
        }

        const movedBy = this.currentTranslate - this.prevTranslate;
        const threshold = this.slideWidth / 4; 

        if (movedBy < -threshold) {
            this.navigate(1); 
        } else if (movedBy > threshold) {
            this.navigate(-1); 
        } else {
            this.updateSliderPosition(true); 
        }
        
        this.resumeAutoplay();
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
}

const initSliders = () => {
    document.querySelectorAll('.custom-slider').forEach(sliderEl => {
        if (!sliderEl.controller) {
            sliderEl.controller = new CustomSliderController(sliderEl);
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSliders);
} else {
    initSliders();
}