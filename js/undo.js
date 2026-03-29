        // ══════════════════════════════════════════════════════════════
        // UNDO SYSTEM
        // ══════════════════════════════════════════════════════════════

        function pushUndo(label) {
            undoStack.push({
                label: label,
                activities: JSON.parse(JSON.stringify(activities)),
                productName: currentProductName,
                programName: currentProgramName
            });
            if (undoStack.length > 20) undoStack.shift();
            updateUndoButton();
        }
        function performUndo() {
            if (undoStack.length === 0) return;
            if (editIndex !== null) {
                showDialog({type:'warning', title:'Undo Unavailable', message:'Finish or cancel the current edit before undoing.'});
                return;
            }
            var state = undoStack.pop();
            activities = state.activities;
            currentProductName = state.productName;
            currentProgramName = state.programName;
            saveToLocalStorage();
            updateProgramDetails();
            generateReport();
            toggleVisibility();
            restorePlanColumnVisibility();
            updateSectionHeaders();
            updateUndoButton();
        }
        function isFormOpen() {
            var form = document.getElementById('courseInputForm');
            return form && !form.classList.contains('hidden');
        }

        function updateUndoButton() {
            var btn = document.getElementById('undoBtn');
            if (!btn) return;

            // Show button if there are activities OR undo history
            var shouldShow = (Array.isArray(activities) && activities.length > 0) || undoStack.length > 0;

            if (shouldShow) {
                btn.classList.add('undo-visible');
            } else {
                btn.classList.remove('undo-visible', 'has-undo');
                return;
            }

            var formActive = editIndex !== null || isFormOpen();
            if (undoStack.length > 0 && !formActive) {
                btn.classList.add('has-undo');
                btn.title = 'Undo: ' + undoStack[undoStack.length - 1].label + ' (Ctrl+Z)';
            } else {
                btn.classList.remove('has-undo');
                btn.title = formActive ? 'Undo unavailable during editing' : 'Nothing to undo';
            }
        }
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('undoBtn').addEventListener('click', function() {
                if (editIndex !== null || isFormOpen()) {
                    showDialog({type:'warning', title:'Undo Unavailable', message:'Finish or cancel the current edit before undoing.'});
                    return;
                }
                if (undoStack.length > 0) performUndo();
            });
        });
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (editIndex !== null || isFormOpen()) {
                    showDialog({type:'warning', title:'Undo Unavailable', message:'Finish or cancel the current edit before undoing.'});
                    return;
                }
                if (undoStack.length > 0) performUndo();
            }
        });
