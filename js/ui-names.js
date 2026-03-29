        function updateSectionHeaders() {
            const mainTitle = document.getElementById('programDetailsHeader');
            const reportTitle = document.getElementById('programReportHeader');

            if (currentProductName && currentProgramName) {
                const nameHTML = ' <span class="header-names-wrap"><span id="verticalBar">|</span> <span class="program-label">' + currentProductName + ': ' + currentProgramName + '</span><span class="header-tooltip">Click to edit product and program names</span></span>';
                mainTitle.innerHTML = 'Design' + nameHTML;
                reportTitle.innerHTML = 'Report' + nameHTML;
            } else if (activities.length > 0) {
                const placeholderHTML = ' <span class="header-names-wrap header-names-placeholder"><span id="verticalBar">|</span> <span class="program-label">Product Name: Training Program</span><span class="header-tooltip">Click to set product and program names</span></span>';
                mainTitle.innerHTML = 'Design' + placeholderHTML;
                reportTitle.innerHTML = 'Report' + placeholderHTML;
            } else {
                mainTitle.textContent = 'Design';
                reportTitle.textContent = 'Report';
            }

            // Click to edit names
            document.querySelectorAll('.header-names-wrap').forEach(function(wrap) {
                wrap.addEventListener('click', function() {
                    showNameEditModal();
                });
                // Tooltip positioning
                wrap.addEventListener('mouseenter', function() {
                    var tip = this.querySelector('.header-tooltip');
                    if (!tip) return;
                    tip.classList.remove('tooltip-top');
                    var wrapRect = this.getBoundingClientRect();
                    var tipWidth = tip.offsetWidth || 350;
                    if (wrapRect.right + tipWidth + 20 > window.innerWidth) {
                        tip.classList.add('tooltip-top');
                    }
                });
            });
        }

        function showNameEditModal() {
            document.getElementById('editProductName').value = currentProductName || '';
            document.getElementById('editProgramName').value = currentProgramName || '';
            var modal = document.getElementById('nameEditModal');
            modal.style.display = 'flex';
            toggleModalScrollLock(true);
            document.getElementById('editProductName').focus();
        }

        function hideNameEditModal() {
            document.getElementById('nameEditModal').style.display = 'none';
            toggleModalScrollLock(false);
        }

        function saveNameEdit() {
            var newProduct = document.getElementById('editProductName').value.trim();
            var newProgram = document.getElementById('editProgramName').value.trim();
            pushUndo('Edited program names');
            currentProductName = newProduct;
            currentProgramName = newProgram;
            saveToLocalStorage();
            updateSectionHeaders();
            hideNameEditModal();
        }

        window.addEventListener('beforeunload', function() {
            if (activities.length === 0) {
                localStorage.removeItem('activities');
            }
        });

        // window.addEventListener('scroll', () => {
        //     const fileDropdown = document.getElementById('fileDropdown');
        //     const manageDropdown = document.getElementById('manageSelectedDropdownContent');

        //     if (fileDropdown && !fileDropdown.classList.contains('hidden')) {
        //         fileDropdown.classList.add('hidden');
        //     }
        //     if (manageDropdown && !manageDropdown.classList.contains('hidden')) {
        //         manageDropdown.classList.add('hidden');
        //     }
        // });
