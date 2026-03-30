// js/components/interactive-controller.js

class CustomSliderController {
    constructor(slider) {
        this.slider = slider;
        this.wrapper = this.slider.querySelector('.slider-wrapper');
        this.slides = Array.from(this.wrapper.querySelectorAll('.slider-slide'));
        this.totalSlides = this.slides.length;

        // Parse breadcrumbs
        this.breakpoints = JSON.parse(this.slider.dataset.breakpoints || '{}');
        this.defaultSpv = parseInt(this.slider.dataset.defaultSpv, 10) || 1;
        this.isDraggable = this.slider.hasAttribute('draggable');
        
        // Autoplay & Infinite State
        this.autoplayType = this.slider.dataset.autoplay || 'none';
        this.autoplayDelay = parseInt(this.slider.dataset.delay, 10) || 3000;
        this.continuousSpeed = parseInt(this.slider.dataset.speed, 10) || 100;
        this.isInfinite = this.slider.dataset.infinite === 'true';
        this.originalLength = parseInt(this.slider.dataset.originalLength, 10) || this.totalSlides;

        this.viewportMap = { mobile: 768, tablet: 1024, laptop: 1366, desktop: 1920, large: 2560 };

        this.currentIndex = this.isInfinite ? this.defaultSpv : 0; // Offset by buffer if infinite
        this.currentSpv = this.defaultSpv;
        this.slideWidth = 0;
        this.gapPx = 0;
        
        this.isDragging = false;
        this.isHovering = false;
        this.startX = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        
        this.autoplayTimer = null;
        this.animationFrame = null;
        this.lastFrameTime = null;

        this.init();
    }

    init() {
        if (this.totalSlides === 0) return;
        this.bindEvents();
        this.handleResize(); 
        
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
                this.stopAutoplay();
                const targetIndex = this.isInfinite ? index + this.currentSpv : index;
                this.goToSlide(targetIndex);
                this.resumeAutoplay();
            });
        });

        window.addEventListener('resize', this.debounce(() => this.handleResize(), 100));

        if (this.isDraggable) {
            this.wrapper.addEventListener('pointerdown', (e) => this.pointerDown(e));
            this.wrapper.addEventListener('pointermove', (e) => this.pointerMove(e));
            this.wrapper.addEventListener('pointerup', (e) => this.pointerUp(e));
            this.wrapper.addEventListener('pointercancel', (e) => this.pointerUp(e));
        }

        // Pause on hover
        this.slider.addEventListener('mouseenter', () => {
            this.isHovering = true;
            this.stopAutoplay();
        });
        this.slider.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.resumeAutoplay();
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
        this.updateSliderPosition(false); 
    }

    // --- AUTOPLAY LOGIC ---
    startAutoplay() {
        if (this.autoplayType === 'interval') {
            this.autoplayTimer = setInterval(() => this.navigate(1), this.autoplayDelay);
        } else if (this.autoplayType === 'continuous') {
            this.lastFrameTime = performance.now();
            this.animationFrame = requestAnimationFrame((time) => this.continuousScroll(time));
        }
    }

    stopAutoplay() {
        if (this.autoplayTimer) clearInterval(this.autoplayTimer);
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.autoplayTimer = null;
        this.animationFrame = null;
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

        const pixelsPerFrame = this.continuousSpeed * deltaTime;
        this.currentTranslate -= pixelsPerFrame;

        // Continuous Loop Reset
        if (this.isInfinite) {
            const totalWidth = this.originalLength * (this.slideWidth + this.gapPx);
            const minTranslate = -totalWidth + this.slideWidth;
            
            if (this.currentTranslate < minTranslate) {
                this.currentTranslate += totalWidth;
                // Snap wrapper seamlessly
                this.wrapper.style.transition = 'none';
            }
        }

        this.prevTranslate = this.currentTranslate;
        this.wrapper.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
        
        this.animationFrame = requestAnimationFrame((time) => this.continuousScroll(time));
    }

    // --- NAVIGATION LOGIC ---
    manualNavigate(direction) {
        this.stopAutoplay();
        this.navigate(direction);
        this.resumeAutoplay();
    }

    navigate(direction) {
        let newIndex = this.currentIndex + direction;

        if (this.isInfinite) {
            const minIndex = this.currentSpv; // Buffer size
            const maxIndex = this.currentSpv + this.originalLength;
            
            this.currentIndex = newIndex;
            this.updateSliderPosition(true);

            // Secretly snap back after transition finishes to create infinite illusion
            setTimeout(() => {
                if (this.currentIndex >= maxIndex) {
                    this.currentIndex -= this.originalLength;
                    this.updateSliderPosition(false); // false = no transition
                } else if (this.currentIndex < minIndex) {
                    this.currentIndex += this.originalLength;
                    this.updateSliderPosition(false);
                }
            }, 300); // 300ms matches CSS transition duration
            
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
        if (this.autoplayType === 'continuous') return; // Handled by requestAnimationFrame

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

        // Calculate logical index regardless of clones
        let logicalIndex = this.isInfinite 
            ? (this.currentIndex - this.currentSpv + this.originalLength) % this.originalLength 
            : this.currentIndex;

        dots.forEach((dot, index) => {
            if (index === logicalIndex) {
                dot.classList.add('is-active');
                dot.style.opacity = '1';
            } else {
                dot.classList.remove('is-active');
                dot.style.opacity = '0.5';
            }
        });
    }

    // --- DRAG LOGIC ---
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
        this.wrapper.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
    }

    pointerUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.wrapper.classList.remove('dragging');
        if (e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);

        if (this.autoplayType === 'continuous') {
            // Let it coast, then resume
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

// Ensure it initializes
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.custom-slider').forEach(slider => {
        new CustomSliderController(slider);
    });
});