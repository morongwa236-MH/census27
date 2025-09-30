document.addEventListener('DOMContentLoaded', () => {
    const householdForm = document.getElementById('householdForm');
    const membersContainer = document.getElementById('members-container');
    const childrenContainer = document.getElementById('children-container');
    const addMemberBtn = document.getElementById('add-member-btn');
    const addChildBtn = document.getElementById('add-child-btn');

    // --- Configuration ---
    // IMPORTANT: Replace this with your newly deployed Google Apps Script URL.
    const API_URL = 'https://script.google.com/macros/s/AKfycbzBlRMi9QjiajsZVwkKMC8dWJfPkk-zHrzg2TlhFQcvzs6TgOlq76FDvXrhPjjbbAQW/exec'; 

    // --- Functions for dynamic form sections ---
    function addPerson(container, templateId, formClass, counter) {
        const template = document.getElementById(templateId);
        const clone = template.content.cloneNode(true).firstElementChild;
        clone.classList.add(formClass);
        clone.querySelector(`.${formClass} h3 .${formClass}-number`).textContent = counter;

        const inputs = clone.querySelectorAll('input, select');
        inputs.forEach(input => {
            const oldName = input.name;
            if (oldName) {
                input.name = `${oldName}_${counter}`;
            }
        });

        setupConditionalFields(clone, counter);

        clone.querySelector('.remove-btn').addEventListener('click', () => {
            clone.remove();
            updatePersonNumbers(container, formClass);
        });

        container.appendChild(clone);
        return clone;
    }

    function updatePersonNumbers(container, formClass) {
        let count = 1;
        container.querySelectorAll(`.${formClass}`).forEach(form => {
            form.querySelector(`.${formClass}-number`).textContent = count;
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                const oldName = input.name;
                const newName = oldName.replace(/_\d+$/, `_${count}`); 
                input.name = newName;
            });
            count++;
        });
    }

    function setupConditionalFields(form, counter) {
        const sacramentGroups = form.querySelectorAll('.sacrament-group');
        sacramentGroups.forEach(group => {
            const radioButtons = group.querySelectorAll('input[type="radio"]');
            const detailsDiv = group.querySelector('.sacrament-details');
            const baseName = radioButtons[0].name.replace(/_\d+$/, ''); 

            radioButtons.forEach(radio => {
                radio.name = `${baseName}_${counter}`;
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'Yes') {
                        detailsDiv.style.display = 'block';
                    } else {
                        detailsDiv.style.display = 'none';
                    }
                });
            });
        });

        const maritalStatusRadios = form.querySelectorAll('input[name^="member_marital_status"]');
        if (maritalStatusRadios.length > 0) {
            const maritalDetailsDiv = form.querySelector('.marital-details');
            const baseName = maritalStatusRadios[0].name.replace(/_\d+$/, '');
            maritalStatusRadios.forEach(radio => {
                radio.name = `${baseName}_${counter}`;
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'Married' || e.target.value === 'Widow[er]') {
                        maritalDetailsDiv.style.display = 'block';
                    } else {
                        maritalDetailsDiv.style.display = 'none';
                    }
                });
            });
        }
        
        const dikabeloRadios = form.querySelectorAll('input[name^="member_dikabelo"]');
        if (dikabeloRadios.length > 0) {
            const dikabeloDetailsDiv = form.querySelector('.dikabelo-details');
            const baseName = dikabeloRadios[0].name.replace(/_\d+$/, '');
            dikabeloRadios.forEach(radio => {
                radio.name = `${baseName}_${counter}`;
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'Yes') {
                        dikabeloDetailsDiv.style.display = 'block';
                    } else {
                        dikabeloDetailsDiv.style.display = 'none';
                    }
                });
            });
        }
    }

    let memberCounter = 1;
    let childCounter = 1;
    addPerson(membersContainer, 'member-template', 'member-form', memberCounter);
    addPerson(childrenContainer, 'child-template', 'child-form', childCounter);

    addMemberBtn.addEventListener('click', () => {
        memberCounter++;
        addPerson(membersContainer, 'member-template', 'member-form', memberCounter);
    });

    addChildBtn.addEventListener('click', () => {
        childCounter++;
        addPerson(childrenContainer, 'child-template', 'child-form', childCounter);
    });

    // --- Form Submission Logic ---
    householdForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            // 1. Prepare and submit Household data
            const householdData = [{
                'Block Name': householdForm.block_name.value,
                'Residential Address': householdForm.residential_address.value,
                'Contact Number': householdForm.contact_number.value,
                'Date Added': new Date().toISOString().split('T')[0]
            }];

            const householdPayload = {
                sheetName: 'Household',
                records: householdData
            };

            const householdResponse = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(householdPayload),
                mode: 'no-cors' // Use 'no-cors' for Google Apps Script
            });
            const householdResult = await householdResponse.json();
            const householdId = householdResult.records[0].id;
            
            // 2. Prepare and submit Members data
            const membersData = [];
            document.querySelectorAll('.member-form').forEach((form, index) => {
                const memberIndex = index + 1;
                const member = {
                    'Household ID': householdId,
                    'First Name': form.querySelector(`[name="member_first_name_${memberIndex}"]`).value,
                    'Last Name': form.querySelector(`[name="member_last_name_${memberIndex}"]`).value,
                    'Date of Birth': form.querySelector(`[name="member_dob_${memberIndex}"]`).value,
                    'Catholic?': form.querySelector(`[name="member_catholic_${memberIndex}"]:checked`)?.value || 'No',
                    'Occupation': form.querySelector(`[name="member_occupation_${memberIndex}"]`).value,
                    'Church Activities': form.querySelector(`[name="member_activities_${memberIndex}"]`).value,
                    'Solidarity/Ministry': form.querySelector(`[name="member_ministry_${memberIndex}"]`).value,
                    'Leadership': form.querySelector(`[name="member_leadership_${memberIndex}"]`).value,
                    
                    'Baptised?': form.querySelector(`[name="member_baptised_${memberIndex}"]:checked`)?.value || 'No',
                    'Date of Baptism': form.querySelector(`[name="member_baptism_date_${memberIndex}"]`).value,
                    'Baptism Registration No.': form.querySelector(`[name="member_baptism_reg_no_${memberIndex}"]`).value,
                    'Church of Baptism': form.querySelector(`[name="member_baptism_church_${memberIndex}"]`).value,
                    'Location of Baptism': form.querySelector(`[name="member_baptism_location_${memberIndex}"]`).value,

                    '1st Communion?': form.querySelector(`[name="member_communion_${memberIndex}"]:checked`)?.value || 'No',
                    'Date of 1st Communion': form.querySelector(`[name="member_communion_date_${memberIndex}"]`).value,
                    'Church of 1st Communion': form.querySelector(`[name="member_communion_church_${memberIndex}"]`).value,
                    
                    'Confirmation?': form.querySelector(`[name="member_confirmation_${memberIndex}"]:checked`)?.value || 'No',
                    'Date of Confirmation': form.querySelector(`[name="member_confirmation_date_${memberIndex}"]`).value,
                    'Church of Confirmation': form.querySelector(`[name="member_confirmation_church_${memberIndex}"]`).value,

                    'Marital Status': form.querySelector(`[name="member_marital_status_${memberIndex}"]:checked`)?.value || 'Single',
                    'Civil Court Marriage Date': form.querySelector(`[name="member_civil_date_${memberIndex}"]`).value,
                    'Church Marriage Date': form.querySelector(`[name="member_church_date_${memberIndex}"]`).value,
                    'Church Marriage Place': form.querySelector(`[name="member_church_place_${memberIndex}"]`).value,
                    'Divorced?': form.querySelector(`[name="member_divorced_${memberIndex}"]:checked`)?.value || 'No',

                    'Dikabelo?': form.querySelector(`[name="member_dikabelo_${memberIndex}"]:checked`)?.value || 'No',
                    'Date of Last Dikabelo': form.querySelector(`[name="member_dikabelo_date_${memberIndex}"]`).value
                };
                membersData.push(member);
            });
            
            const membersPayload = {
                sheetName: 'Members',
                records: membersData
            };
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(membersPayload),
                mode: 'no-cors'
            });

            // 3. Prepare and submit Children data
            const childrenData = [];
            document.querySelectorAll('.child-form').forEach((form, index) => {
                const childIndex = index + 1;
                const child = {
                    'Household ID': householdId,
                    'First Name': form.querySelector(`[name="child_first_name_${childIndex}"]`).value,
                    'Last Name': form.querySelector(`[name="child_last_name_${childIndex}"]`).value,
                    'Date of Birth': form.querySelector(`[name="child_dob_${childIndex}"]`).value,
                    'Age': form.querySelector(`[name="child_age_${childIndex}"]`).value,
                    'Catholic?': form.querySelector(`[name="child_catholic_${childIndex}"]:checked`)?.value || 'No',
                    'Church Activities': form.querySelector(`[name="child_activities_${childIndex}"]`).value,
                    
                    'Baptised?': form.querySelector(`[name="child_baptised_${childIndex}"]:checked`)?.value || 'No',
                    'Date of Baptism': form.querySelector(`[name="child_baptism_date_${childIndex}"]`).value,
                    'Baptism Registration No.': form.querySelector(`[name="child_baptism_reg_no_${childIndex}"]`).value,
                    'Church of Baptism': form.querySelector(`[name="child_baptism_church_${childIndex}"]`).value,
                    'Location of Church': form.querySelector(`[name="child_baptism_location_${childIndex}"]`).value,

                    '1st Communion?': form.querySelector(`[name="child_communion_${childIndex}"]:checked`)?.value || 'No',
                    'Date of 1st Communion': form.querySelector(`[name="child_communion_date_${childIndex}"]`).value,
                    'Church of 1st Communion': form.querySelector(`[name="child_communion_church_${childIndex}"]`).value,
                    
                    'Confirmation?': form.querySelector(`[name="child_confirmation_${childIndex}"]:checked`)?.value || 'No',
                    'Date of Confirmation': form.querySelector(`[name="child_confirmation_date_${childIndex}"]`).value,
                    'Church of Confirmation': form.querySelector(`[name="child_confirmation_church_${childIndex}"]`).value,
                };
                childrenData.push(child);
            });
            
            const childrenPayload = {
                sheetName: 'Children',
                records: childrenData
            };
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(childrenPayload),
                mode: 'no-cors'
            });

            alert('Form submitted successfully!');
            window.location.reload(); // Reload the page to reset the form

        } catch (error) {
            console.error('Submission failed:', error);
            alert('An error occurred during submission. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Form';
        }
    });
});
