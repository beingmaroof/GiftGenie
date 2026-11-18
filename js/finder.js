
/* ==========================================================================
   GIFTGENIE — GIFT FINDER
   Handles form validation, profile completion and preference collection
   ========================================================================== */

(function () {
  'use strict';

  const form = document.getElementById('finderForm');
  const clearFormBtn = document.getElementById('clearFormBtn');

  // Elements used for the profile completion gauge
  const progressCircle = document.getElementById('progressCircle');
  const progressValue = document.getElementById('progressValue');
  const progressLabel = document.getElementById('progressLabel');
  const progressMessage = document.getElementById('progressMessage');

  // Set form values from occasion or category links on the homepage
  function applyURLParams() {
    const params = new URLSearchParams(window.location.search);

    const occasion = params.get('occasion');
    if (occasion) {
      const el = document.getElementById('occasion');
      if (el) el.value = occasion;
    }

    const budget = params.get('budget');
    if (budget) {
      const radio = document.querySelector(`input[name="budget"][value="${budget}"]`);
      if (radio) radio.checked = true;
    }

    const interest = params.get('interest');
    if (interest) {
      const cb = document.querySelector(`input[name="interests"][value="${interest}"]`);
      if (cb) cb.checked = true;
    }
  }

  // Update the completion percentage as the user fills in the form
  function updateProfileCompletion() {
    const CIRCUMFERENCE = 2 * Math.PI * 27;
    const REQUIRED_WEIGHT = 15;
    const OPTIONAL_WEIGHT = 5;

    let totalWeight = 0;
    let completedWeight = 0;

    const checkField = (isFilled, isRequired = true) => {
      const weight = isRequired ? REQUIRED_WEIGHT : OPTIONAL_WEIGHT;
      totalWeight += weight;
      if (isFilled) completedWeight += weight;
    };

    // Check required fields
    checkField(Boolean(document.getElementById('occasion')?.value), true);
    checkField(Boolean(document.getElementById('relationship')?.value), true);
    checkField(Boolean(document.querySelector('input[name="budget"]:checked')), true);

    const ageVal = parseInt(document.getElementById('age')?.value, 10);
    checkField(!isNaN(ageVal) && ageVal > 0 && ageVal <= 120, true);
    checkField(Boolean(document.querySelector('input[name="gender"]:checked')), true);

    // Check optional fields
    checkField(document.querySelectorAll('input[name="interests"]:checked').length > 0, false);
    checkField(Boolean(document.getElementById('occupation')?.value), false);
    checkField(document.querySelectorAll('input[name="personality"]:checked').length > 0, false);
    checkField(Boolean(document.getElementById('additionalText')?.value.trim()), false);

    const percentage = Math.round((completedWeight / totalWeight) * 100);
    const strokeOffset = CIRCUMFERENCE - (CIRCUMFERENCE * percentage / 100);

    if (progressCircle) progressCircle.style.strokeDashoffset = strokeOffset;
    if (progressValue) progressValue.textContent = `${percentage}%`;

    // Show a message based on how much of the form is completed
    if (percentage === 0) {
      progressLabel.textContent = "Let's get started";
      progressMessage.textContent = 'Fill in the required fields below to receive recommendations.';
    } else if (percentage < 60) {
      progressLabel.textContent = 'Making progress';
      progressMessage.textContent = 'Please complete the required details.';
    } else if (percentage < 100) {
      progressLabel.textContent = 'Almost complete';
      progressMessage.textContent = 'Optional details will sharpen your results.';
    } else {
      progressLabel.textContent = 'Ready to discover';
      progressMessage.textContent = 'All parameters specified. Click Generate Recommendations.';
    }
  }

  // Display an error message for an invalid field
  function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    const input = document.getElementById(fieldId);
    if (input) {
      input.classList.add(input.tagName === 'SELECT' ? 'form-select--error' : 'form-input--error');
    }
  }

  // Check the required fields before submitting the form
  function validateForm() {
    let isValid = true;

    // Clear errors from the previous validation
    document.querySelectorAll('.form-error').forEach(el => {
      el.style.display = 'none';
      el.textContent = '';
    });

    document.querySelectorAll('.form-input--error, .form-select--error').forEach(el => {
      el.classList.remove('form-input--error', 'form-select--error');
    });

    if (!document.getElementById('occasion')?.value) {
      showFieldError('occasion', 'Please select an occasion.');
      isValid = false;
    }

    if (!document.getElementById('relationship')?.value) {
      showFieldError('relationship', 'Please select a relationship.');
      isValid = false;
    }

    if (!document.querySelector('input[name="budget"]:checked')) {
      showFieldError('budget', 'Please select a budget ceiling.');
      isValid = false;
    }

    const ageInput = document.getElementById('age');
    const ageVal = parseInt(ageInput?.value, 10);

    if (!ageInput?.value) {
      showFieldError('age', 'Please enter an age.');
      isValid = false;
    } else if (isNaN(ageVal) || ageVal < 1 || ageVal > 120) {
      showFieldError('age', 'Please enter an age between 1 and 120.');
      isValid = false;
    }

    if (!document.querySelector('input[name="gender"]:checked')) {
      showFieldError('gender', 'Please choose a gender option.');
      isValid = false;
    }

    return isValid;
  }

  // Collect the selected preferences from the form
  function collectFormData() {
    const getCheckedValues = (name) =>
      Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);

    return {
      occasion: document.getElementById('occasion')?.value || '',
      relationship: document.getElementById('relationship')?.value || '',
      budget: document.querySelector('input[name="budget"]:checked')?.value || '',
      age: document.getElementById('age')?.value || '',
      gender: document.querySelector('input[name="gender"]:checked')?.value || '',
      interests: getCheckedValues('interests'),
      occupation: document.getElementById('occupation')?.value || '',
      personality: getCheckedValues('personality'),
      additionalText: document.getElementById('additionalText')?.value.trim() || ''
    };
  }

  // Clear all form fields and reset the completion gauge
  function clearForm() {
    form.reset();

    document.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.form-input--error, .form-select--error').forEach(el => {
      el.classList.remove('form-input--error', 'form-select--error');
    });

    updateProfileCompletion();
    App.showToast('Form cleared', 'info');
  }

  // Set up form events and submission
  function init() {
    if (!form) return;

    applyURLParams();
    updateProfileCompletion();

    form.addEventListener('input', updateProfileCompletion);
    form.addEventListener('change', updateProfileCompletion);

    if (clearFormBtn) {
      clearFormBtn.addEventListener('click', clearForm);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) {
        App.showToast('Please complete all required fields.', 'error');

        const firstError = document.querySelector('.form-error[style*="block"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      Storage.setFinderData(collectFormData());
      window.location.href = 'results.html';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
