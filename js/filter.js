        // ── Filter state ────────────────────────────────────────────────
        let activeFilters = {
            unit: '',
            module: '',
            objective: '',
            cognitiveTask: [],
            learnerActivity: [],
            deliveryMethod: [],
            media: [],
            contentType: [],
            plan: [],
            durationMin: null,
            durationMax: null
        };

        function hasActiveFilters() {
            return activeFilters.unit.trim() !== '' ||
                activeFilters.module.trim() !== '' ||
                activeFilters.objective.trim() !== '' ||
                activeFilters.cognitiveTask.length > 0 ||
                activeFilters.learnerActivity.length > 0 ||
                activeFilters.deliveryMethod.length > 0 ||
                activeFilters.media.length > 0 ||
                activeFilters.contentType.length > 0 ||
                activeFilters.plan.length > 0 ||
                activeFilters.durationMin !== null ||
                activeFilters.durationMax !== null;
        }

        function activityMatchesFilters(activity) {
            if (activity.isBreak) {
                if (activeFilters.durationMin !== null && activity.duration < activeFilters.durationMin) return false;
                if (activeFilters.durationMax !== null && activity.duration > activeFilters.durationMax) return false;
                if (activeFilters.unit.trim() || activeFilters.module.trim() || activeFilters.objective.trim() ||
                    activeFilters.cognitiveTask.length > 0 || activeFilters.learnerActivity.length > 0 ||
                    activeFilters.deliveryMethod.length > 0 || activeFilters.media.length > 0 ||
                    activeFilters.contentType.length > 0 || activeFilters.plan.length > 0) return false;
                return true;
            }

            if (activeFilters.unit.trim() && !(activity.chapter || '').toLowerCase().includes(activeFilters.unit.trim().toLowerCase())) return false;
            if (activeFilters.module.trim() && !(activity.moduleTitle || '').toLowerCase().includes(activeFilters.module.trim().toLowerCase())) return false;
            if (activeFilters.objective.trim() && !(activity.objective || '').toLowerCase().includes(activeFilters.objective.trim().toLowerCase())) return false;

            if (activeFilters.cognitiveTask.length > 0 && !activeFilters.cognitiveTask.includes(activity.cognitiveTask)) return false;
            if (activeFilters.learnerActivity.length > 0 && !activeFilters.learnerActivity.includes(activity.learnerActivity)) return false;
            if (activeFilters.deliveryMethod.length > 0 && !activeFilters.deliveryMethod.includes(activity.deliveryMethod)) return false;
            if (activeFilters.media.length > 0 && !activeFilters.media.includes(activity.media)) return false;
            if (activeFilters.contentType.length > 0 && !activeFilters.contentType.includes(activity.contentType)) return false;
            if (activeFilters.plan.length > 0 && !activeFilters.plan.includes(activity.plan || 'Keep')) return false;

            if (activeFilters.durationMin !== null && activity.duration < activeFilters.durationMin) return false;
            if (activeFilters.durationMax !== null && activity.duration > activeFilters.durationMax) return false;

            return true;
        }

        function applyFilters() {
            const hasFilters = hasActiveFilters();
            const filterBtn = document.getElementById('filterBtn');
            const filterBar = document.getElementById('filterBar');

            if (filterBtn) {
                filterBtn.classList.toggle('has-filters', hasFilters);
            }

            updateFilterBar();

            if (filterBar) {
                filterBar.classList.toggle('visible', hasFilters);
                document.body.classList.toggle('filter-bar-active', hasFilters);
            }

            document.querySelectorAll('.day-table-container').forEach(container => {
                const rows = container.querySelectorAll('.day-table tbody tr');
                let visibleDuration = 0;
                let totalDuration = 0;

                rows.forEach(row => {
                    const indexEl = row.querySelector('.delete-btn') || row.querySelector('[data-index]');
                    if (!indexEl) return;
                    const index = parseInt(indexEl.dataset.index);
                    if (isNaN(index) || !activities[index]) return;

                    const activity = activities[index];
                    const isRemovePlan = activity.plan === 'Remove';

                    if (!isRemovePlan) totalDuration += activity.duration;

                    if (hasFilters) {
                        if (activityMatchesFilters(activity)) {
                            row.classList.remove('filter-row-hidden');
                            if (!isRemovePlan) visibleDuration += activity.duration;
                        } else {
                            row.classList.add('filter-row-hidden');
                        }
                    } else {
                        row.classList.remove('filter-row-hidden');
                        visibleDuration = totalDuration;
                    }
                });

                const totalDurationDiv = container.querySelector('.total-duration');
                if (totalDurationDiv) {
                    if (hasFilters) {
                        const hrs = visibleDuration / 60;
                        const hrsFormatted = hrs % 1 === 0 ? hrs.toFixed(0) : hrs.toFixed(1);
                        totalDurationDiv.innerHTML = `Total Duration: ${visibleDuration} min | ${hrsFormatted} ${hrs <= 1 ? 'hr' : 'hrs'}<span class="filtered-label">(filtered)</span>`;
                        totalDurationDiv.classList.add('filtered');
                    } else {
                        totalDurationDiv.classList.remove('filtered');
                        const hrs = totalDuration / 60;
                        const hrsFormatted = hrs % 1 === 0 ? hrs.toFixed(0) : hrs.toFixed(1);
                        totalDurationDiv.textContent = `Total Duration: ${totalDuration} min | ${hrsFormatted} ${hrs <= 1 ? 'hr' : 'hrs'}`;
                    }
                }
            });
        }

        function updateFilterBar() {
            const tagsContainer = document.getElementById('filterTags');
            if (!tagsContainer) return;
            tagsContainer.innerHTML = '';

            const addTag = (field, value) => {
                const tag = document.createElement('span');
                tag.className = 'filter-tag';
                tag.innerHTML = `<span class="filter-tag-field">${field}</span> ${value}`;
                tagsContainer.appendChild(tag);
            };

            if (activeFilters.unit.trim()) addTag('Unit', activeFilters.unit.trim());
            if (activeFilters.module.trim()) addTag('Module', activeFilters.module.trim());
            if (activeFilters.objective.trim()) addTag('Objective', activeFilters.objective.trim());
            if (activeFilters.cognitiveTask.length > 0) addTag('Cognitive', activeFilters.cognitiveTask.join(', '));
            if (activeFilters.learnerActivity.length > 0) {
                const val = activeFilters.learnerActivity.length > 2
                    ? activeFilters.learnerActivity.slice(0, 2).join(', ') + ' +' + (activeFilters.learnerActivity.length - 2)
                    : activeFilters.learnerActivity.join(', ');
                addTag('Activity', val);
            }
            if (activeFilters.deliveryMethod.length > 0) addTag('Delivery', activeFilters.deliveryMethod.join(', '));
            if (activeFilters.media.length > 0) {
                const val = activeFilters.media.length > 2
                    ? activeFilters.media.slice(0, 2).join(', ') + ' +' + (activeFilters.media.length - 2)
                    : activeFilters.media.join(', ');
                addTag('Media', val);
            }
            if (activeFilters.contentType.length > 0) addTag('Content', activeFilters.contentType.length + ' selected');
            if (activeFilters.plan.length > 0) addTag('Plan', activeFilters.plan.join(', '));
            if (activeFilters.durationMin !== null || activeFilters.durationMax !== null) {
                let val = '';
                if (activeFilters.durationMin !== null && activeFilters.durationMax !== null)
                    val = activeFilters.durationMin + ' - ' + activeFilters.durationMax + ' min';
                else if (activeFilters.durationMin !== null)
                    val = '≥ ' + activeFilters.durationMin + ' min';
                else
                    val = '≤ ' + activeFilters.durationMax + ' min';
                addTag('Duration', val);
            }
        }

        function clearAllFilters() {
            activeFilters = {
                unit: '',
                module: '',
                objective: '',
                cognitiveTask: [],
                learnerActivity: [],
                deliveryMethod: [],
                media: [],
                contentType: [],
                plan: [],
                durationMin: null,
                durationMax: null
            };
            applyFilters();
        }

        function buildFilterChips(containerId, optionsList, filterKey) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            optionsList.forEach(opt => {
                const chip = document.createElement('span');
                chip.className = 'filter-chip';
                chip.textContent = opt;
                if (activeFilters[filterKey].includes(opt)) chip.classList.add('selected');
                chip.addEventListener('click', () => chip.classList.toggle('selected'));
                container.appendChild(chip);
            });
        }

        function buildGroupedFilterChips(containerId, groups, optionsList, filterKey) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';

            // Wrapper isolates group containers from the parent chip-grid's gap
            const wrapper = document.createElement('div');
            wrapper.className = 'filter-chip-grouped-list';
            container.appendChild(wrapper);

            groups.forEach(group => {
                // Items in this group, ordered by optionsList sequence
                const groupItems = optionsList.filter(opt => group.activities.includes(opt));
                if (groupItems.length === 0) return;

                const groupContainer = document.createElement('div');
                groupContainer.className = 'filter-chip-group-container';
                groupContainer.style.setProperty('--group-color', group.chartColor);

                // Group header chip
                const groupChip = document.createElement('span');
                groupChip.className = 'filter-chip filter-chip-group';
                groupChip.dataset.isGroup = 'true';
                groupChip.textContent = group.label;
                groupChip.style.setProperty('--group-color', group.chartColor);

                const groupLabel = document.createElement('span');
                groupLabel.className = 'filter-chip-group-header-label';
                groupLabel.textContent = 'group';

                const headerRow = document.createElement('div');
                headerRow.className = 'filter-chip-group-header';
                headerRow.appendChild(groupChip);
                headerRow.appendChild(groupLabel);

                // Items row
                const itemsRow = document.createElement('div');
                itemsRow.className = 'filter-chip-group-items';

                const itemChips = [];
                groupItems.forEach(opt => {
                    const chip = document.createElement('span');
                    chip.className = 'filter-chip filter-chip-item';
                    chip.textContent = opt;
                    chip.style.setProperty('--group-color', group.chartColor);
                    if (activeFilters[filterKey].includes(opt)) chip.classList.add('selected');
                    itemChips.push(chip);
                    itemsRow.appendChild(chip);
                });

                const syncGroupChip = () => {
                    const allSelected = itemChips.length > 0 && itemChips.every(c => c.classList.contains('selected'));
                    groupChip.classList.toggle('selected', allSelected);
                };

                syncGroupChip();

                // Group chip click → toggle all items
                groupChip.addEventListener('click', () => {
                    const allSelected = itemChips.every(c => c.classList.contains('selected'));
                    itemChips.forEach(c => c.classList.toggle('selected', !allSelected));
                    syncGroupChip();
                });

                // Item chip click → toggle, then sync group chip
                itemChips.forEach(chip => {
                    chip.addEventListener('click', () => {
                        chip.classList.toggle('selected');
                        syncGroupChip();
                    });
                });

                groupContainer.appendChild(headerRow);
                groupContainer.appendChild(itemsRow);
                wrapper.appendChild(groupContainer);
            });
        }

        function openFilterModal() {
            document.getElementById('filterUnit').value = activeFilters.unit;
            document.getElementById('filterModule').value = activeFilters.module;
            document.getElementById('filterObjective').value = activeFilters.objective;

            buildFilterChips('filterCognitiveChips', options.cognitiveTasks, 'cognitiveTask');
            buildGroupedFilterChips('filterActivityChips', LEARNER_ACTIVITY_GROUPS, options.learnerActivities, 'learnerActivity');
            buildFilterChips('filterDeliveryChips', options.deliveryMethods, 'deliveryMethod');
            buildGroupedFilterChips('filterMediaChips', MEDIA_GROUPS, options.mediaOptions, 'media');
            buildFilterChips('filterContentChips', options.contentTypes, 'contentType');
            buildFilterChips('filterPlanChips', options.planOptions, 'plan');

            const planSection = document.getElementById('filterPlanSection');
            const planDivider = document.getElementById('filterPlanDivider');
            planSection.style.display = arePlannerColumnsHidden ? 'none' : '';
            planDivider.style.display = arePlannerColumnsHidden ? 'none' : '';

            document.getElementById('filterDurationMin').value = activeFilters.durationMin !== null ? activeFilters.durationMin : '';
            document.getElementById('filterDurationMax').value = activeFilters.durationMax !== null ? activeFilters.durationMax : '';

            document.getElementById('filterModal').style.display = 'flex';
            if (typeof toggleModalScrollLock === 'function') toggleModalScrollLock(true);
        }

        function closeFilterModal() {
            document.getElementById('filterModal').style.display = 'none';
            if (typeof toggleModalScrollLock === 'function') toggleModalScrollLock(false);
        }

        function readFilterModalState() {
            activeFilters.unit = document.getElementById('filterUnit').value;
            activeFilters.module = document.getElementById('filterModule').value;
            activeFilters.objective = document.getElementById('filterObjective').value;

            const readChips = (containerId) =>
                Array.from(document.querySelectorAll(`#${containerId} .filter-chip.selected`))
                    .filter(c => !c.dataset.isGroup)
                    .map(c => c.textContent);

            activeFilters.cognitiveTask  = readChips('filterCognitiveChips');
            activeFilters.learnerActivity = readChips('filterActivityChips');
            activeFilters.deliveryMethod = readChips('filterDeliveryChips');
            activeFilters.media          = readChips('filterMediaChips');
            activeFilters.contentType    = readChips('filterContentChips');
            activeFilters.plan           = readChips('filterPlanChips');

            const minVal = document.getElementById('filterDurationMin').value;
            const maxVal = document.getElementById('filterDurationMax').value;
            activeFilters.durationMin = minVal !== '' && !isNaN(parseInt(minVal)) ? parseInt(minVal) : null;
            activeFilters.durationMax = maxVal !== '' && !isNaN(parseInt(maxVal)) ? parseInt(maxVal) : null;
        }

        // ── Filter event listeners ───────────────────────────────────────
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('filterBtn').addEventListener('click', openFilterModal);

            document.getElementById('filterApplyBtn').addEventListener('click', function() {
                readFilterModalState();
                closeFilterModal();
                applyFilters();
            });

            document.getElementById('filterCancelBtn').addEventListener('click', closeFilterModal);

            document.getElementById('filterClearAllBtn').addEventListener('click', function() {
                document.getElementById('filterUnit').value = '';
                document.getElementById('filterModule').value = '';
                document.getElementById('filterObjective').value = '';
                document.getElementById('filterDurationMin').value = '';
                document.getElementById('filterDurationMax').value = '';
                document.querySelectorAll('.filter-chip.selected').forEach(c => c.classList.remove('selected'));
            });

            document.getElementById('filterBarClear').addEventListener('click', clearAllFilters);

            document.getElementById('filterModal').addEventListener('click', function(e) {
                if (e.target === this) closeFilterModal();
            });

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && document.getElementById('filterModal').style.display === 'flex') {
                    closeFilterModal();
                }
            });
        });
