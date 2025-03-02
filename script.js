document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('serviceForm');
    const weddingOptions = document.getElementById('weddingOptions');
    const totalPriceSpan = document.getElementById('totalPrice');
    const weddingCheckbox = form.querySelector('input[value="wedding"]');
    const addons = form.querySelectorAll('input[name="addon"]');
    const photoInputs = form.querySelectorAll('.photo-input input[type="number"]');

    // Price per photo for each service (logarithmic-like decrease)
    const pricePerPhoto = {
        basic: {
            1: 20, 2: 18, 3: 16, 4: 14, 5: 13, 6: 12, 7: 11, 8: 10, 9: 9.5, 
            10: 9, 11: 8.5, 12: 8, 13: 7.5, 14: 7, 15: 6.5, 16: 6, 17: 5.5, 
            18: 5, 19: 4.5, 20: 4
        },
        wedding: {
            1: 50, 2: 45, 3: 40, 4: 35, 5: 32, 6: 30, 7: 28, 8: 26, 9: 24, 
            10: 22, 11: 20, 12: 19, 13: 18, 14: 17, 15: 16, 16: 15, 17: 14, 
            18: 13, 19: 12, 20: 11, 21: 10.5, 22: 10, 23: 9.5, 24: 9, 
            25: 8.5, 26: 8, 27: 7.5, 28: 7, 29: 6.5, 30: 6, 31: 5.8, 
            32: 5.6, 33: 5.4, 34: 5.2, 35: 5, 36: 4.8, 37: 4.6, 38: 4.4, 
            39: 4.2, 40: 4, 41: 3.9, 42: 3.8, 43: 3.7, 44: 3.6, 45: 3.5, 
            46: 3.4, 47: 3.3, 48: 3.2, 49: 3.1, 50: 3
        },
        portrait: {
            1: 25, 2: 22, 3: 20, 4: 18, 5: 16, 6: 14, 7: 12, 8: 10, 9: 9, 
            10: 8, 11: 7, 12: 6, 13: 5.5, 14: 5, 15: 4.5
        }
    };

    // Maximum photo limits for each service
    const maxPhotos = {
        basic: 20,
        wedding: 50,
        portrait: 15
    };

    // Function to get total price for a service based on number of photos
    function getServicePrice(service, numPhotos) {
        const prices = pricePerPhoto[service];
        if (!prices || numPhotos < 1) return 0;

        const maxPhotosForService = maxPhotos[service];
        const cappedPhotos = Math.min(numPhotos, maxPhotosForService);
        const pricePer = prices[cappedPhotos] || prices[maxPhotosForService];
        return pricePer * cappedPhotos;
    }

    // Function to calculate total price
    function calculateTotal() {
        let total = 0;
        const checkedServices = form.querySelectorAll('input[name="service"]:checked');
        const checkedAddons = form.querySelectorAll('input[name="addon"]:checked');

        checkedServices.forEach(service => {
            const photoInput = form.querySelector(`input[name="photos_${service.value}"]`);
            const numPhotos = photoInput ? parseInt(photoInput.value) || 1 : 1;
            total += getServicePrice(service.value, numPhotos);
        });

        if (weddingCheckbox.checked) {
            checkedAddons.forEach(addon => {
                total += parseInt(addon.getAttribute('data-price')) || 0;
            });
        }

        totalPriceSpan.textContent = Math.round(total * 100) / 100;
    }

    // Event listener for form changes
    form.addEventListener('change', (event) => {
        const target = event.target;

        if (target.name === 'service') {
            const photoInputDiv = form.querySelector(`.photo-input[data-service="${target.value}"]`);
            if (target.checked) {
                photoInputDiv.classList.remove('hidden');
            } else {
                photoInputDiv.classList.add('hidden');
                const photoInput = photoInputDiv.querySelector('input');
                photoInput.value = 1; // Reset to 1 when unchecked
            }

            if (target.value === 'wedding') {
                weddingOptions.classList.toggle('hidden', !target.checked);
                if (!target.checked) {
                    addons.forEach(addon => {
                        addon.checked = false;
                    });
                }
            }
        }

        calculateTotal();
    });

    // Event listener for photo number inputs
    photoInputs.forEach(input => {
        input.addEventListener('input', (event) => {
            const service = input.name.replace('photos_', '');
            const max = maxPhotos[service];
            let value = event.target.value;

            // Remove non-numeric characters
            value = value.replace(/[^0-9]/g, '');

            // Enforce minimum and maximum
            if (value === '' || parseInt(value) < 1) {
                value = '1';
            } else if (parseInt(value) > max) {
                value = max.toString();
            }

            event.target.value = value; // Update input field
            calculateTotal(); // Recalculate total
        });

        // Prevent letters via keypress (additional layer of protection)
        input.addEventListener('keypress', (event) => {
            const charCode = event.charCode;
            if (charCode < 48 || charCode > 57) { // Allow only 0-9
                event.preventDefault();
            }
        });
    });
});