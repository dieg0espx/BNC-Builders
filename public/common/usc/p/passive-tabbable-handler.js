if (!window.USC) { window.USC = {}; }
require2(['usc/p/usc-utils', 'usc/p/slide-toggle'], () => {


	/**
	 * Take the Event and call the appropiate function with the Tabbable Context
	 * 
	 * @param {Event} e
	 * @param {HTMLElement} elTab 
	 */
	window.USC.tabbableHandler = (e, elTab) => {

		// If we don't have a tabbable instance, don't continue. 
		var data = elTab.$tabbable;
		if (!data) { console.log('Error: $tabbable missing from current context.'); return; }

		// We're only concerned with click and keydown events. 
		// Map those to the functions for processing them.
		if (e.type === 'click') USC.tabbableClick(e, data);
		else if (e.type === 'keydown') USC.tabbableKeyDown(e, data);

	}

	/**
	 * Handles click events and key downs that will count as clicks.
	 * 
	 * @param {Event} e 
	 */
	window.USC.tabbableClick = function (e, data) {

		// If we're directly calling this function, take the this as the data to run from.
		if (!data) data = this;

		// Make sure we clicked on or inside of a tab.
		const target = e.target;
		let tab = target.closest('.el-tab');
		const secTab = target.closest('.el-sec-tab');
		const next = target.closest('.el-next-btn');
		const prev = target.closest('.el-prev-btn');

		// If we clicked the next button, makre sure we're in bounds and then open the next panel.
		if (next && data.activeIndex <= data.els.panels.length) {

			// If we're using form controls, grab them and let's validate before we move.
			if (data.options.stepForm) if (!checkValidity(data)) return;
			USC.tabState(data.activeIndex + 1, data);

			// If we clicked on the previous button, make sure we're in bound and then go to the previous panel.
		} else if (prev && data.activeIndex > 0) {
			USC.tabState(data.activeIndex - 1, data);

			// Turn off the tabs if we're using hovers without hoverStay. 
		} else if (!tab && !secTab) {
			if (data.options.hover && !data.options.hoverStay) USC.tabState(-1, data);
		} else {

			// If what we have is a secondary tab, let's get the regular tab before we move on.
			const sti = data.els.secTabs.indexOf(secTab);
			if (secTab && sti > -1) tab = data.els.tabs[sti];

			// Since it is a tab, let's make sure it belongs to this level of tabs.
			const ti = data.els.tabs.indexOf(tab);
			if (ti === -1) return;

			// If we're using form controls, grab them and let's validate before we move. 
			if (data.options.stepForm && !checkValidity(data)) return;

			// Check to see if the tab is active.
			if (tab.classList.contains('active')) {

				// Turn off all tabs if we want to close.
				if (data.options.closing) {
					data.activeIndex = -1;
					USC.tabState(-1, data);
				}

			} else {
				// Since we have a tab that belongs to this instance and it's not active, activate it.
				USC.tabState(data.els.tabs.indexOf(tab), data);
			}

		}
	};


	/**
	 * Handles Key Down Events
	 * 
	 * @param {KeyboardEvent} e 
	 */
	window.USC.tabbableKeyDown = function (e, data) {
		const target = e.target;
		const key = e.key;
		const tab = target.closest('.el-tab');
		const secTab = target.closest('.el-sec-tab');
		const panel = target.closest('.el-panel');
		const nextPrev = target.closest('.el-next-btn, .el-prev-btn');

		// Check to see if we're on a tab or secondary tab and it belongs to this tabbable set.
		if (tab && data.els.tabs.indexOf(tab) !== -1 || secTab && data.els.secTabs.indexOf(secTab) !== -1) {

			if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
				e.preventDefault();

				let index;
				switch (key) {
					// For arrow right and down, move to the next tab or wrap to the first tab.
					case 'ArrowRight':
					case 'ArrowDown':
						index = (data.els.tabs.indexOf(tab) + 1) % data.els.tabs.length;
						break;
					// For arrow left and up, move to the previous tab or wrap to the last tab.
					case 'ArrowLeft':
					case 'ArrowUp':
						index = (data.els.tabs.indexOf(tab) - 1 + data.els.tabs.length) % data.els.tabs.length;
						break;
					// Home goes to the first tab.
					case 'Home':
						index = 0;
						break;
					// End goes to the last tab. 
					case 'End':
						index = data.els.tabs.length - 1;
						break;
				}

				// Move the user's focus.
				data.els.tabs[index].focus();
			}
			// If we're on a tab, we've pushed the tab key, not held shift. 
			else if (key === 'Tab' && !e.shiftKey) {

				// If we have an active panel, and we're current on the active tab, move to the panel.
				if (data.activeIndex !== -1 && tab.classList.contains('active')) {
					data.els.panels[data.activeIndex].focus();
					e.preventDefault();
				}
				// If we're on the last tab and it's not active, we need to escape the tabs display. 
				else if (tab === data.els.tabs[data.els.tabs.length - 1] && !tab.classList.contains('active') && !data.options.siblings) tabsEscape(data);

			}

		}
		// Check to see if we're somewhere within a panel and it belongs to this tabbable set. 
		else if (panel && data.els.panels.indexOf(panel) !== -1 && !nextPrev) {

			// If it wasn't the tab key, then we don't need to do anything else. 
			if (key != 'Tab') return;

			// Get the last focusable element in the panel.
			const focusable = panel.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			// If we on the panel or the first element in the panel and the user held shift, we can simply go back to the tab.
			if (target === panel && e.shiftKey || target === first && e.shiftKey) {
				data.els.tabs[data.activeIndex].focus();
				e.preventDefault();
			}
			// If we're on the last element and shift wasn't held or we're on the panel and there are no more elements, we may want to move. 
			else if ((target === last && !e.shiftKey) || (target === panel && !last)) {
				let index = data.activeIndex + 1;

				// find all top level tabbable things in case there's stuff between the tabs.
				const tabsFocusable = Array.from(data.els.tabBox.querySelectorAll('a, button, input, select, textarea')).filter(el => {
					const pnl = el.closest('.el-panel');
					return !pnl || !data.els.panels.includes(pnl);
				});

				// If there's a link or anything before the next tab, go there. 
				const i = tabsFocusable.indexOf(data.els.tabs[data.activeIndex])
				if (i > -1 && i < tabsFocusable.length - 1) {
					tabsFocusable[i + 1].focus();
					e.preventDefault();
					if (data.options.closing) USC.tabState(-1, data);
				}
				// If there's another tab to go to, do it. Otherwise, it's time to escape since we're leaving the last panel.
				else if (index < data.els.tabs.length) {
					data.els.tabs[index].focus();
					e.preventDefault();
					if (data.options.closing) USC.tabState(-1, data);
				} else tabsEscape(data);

			}

		}

	}

	/**
	 * If we're closing when you leave a tab, this function handles it.
	 * 
	 * @param {MouseEvent} e 
	 */
	window.USC.tabbableMouseLeave = function (e) {
		USC.tabState(-1, this);
	}

	/**
	 * Check Validity Function for Stepping Forms.
	 */
	function checkValidity(data) {

		// Find the currently active panel.
		const activePanel = data.els.panels.find(panel => panel.classList.contains('active'));

		// If no active panel is found, consider it valid to prevent errors.
		if (!activePanel) {
			console.error("No active panel found.");
			return true;
		}

		// Collect all input elements within the active panel.
		const inputs = Array.from(activePanel.querySelectorAll('input, select, textarea'));

		// Validate each input element.
		for (const input of inputs) {
			if (!input.checkValidity()) {
				input.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => { input.reportValidity(); }, 500);
				return false;
			}

			// Fire 'invalid' event if input is invalid.
			if (!input.dispatchEvent(new Event('invalid', { bubbles: true, cancelable: true }))) {
				return false;
			}
		}

		// If we don't find inputs or none come back invalid, return true.
		return true;
	}

	/**
	 * Escapes the user from the tabbable display.
	 */
	const tabsEscape = (data) => {
		// Since we're going forward and there's nothing left in the tabs to show, create a temp element to jump us over the active panel we've already viewed.
		var esc = document.createElement('span')
		esc.setAttribute('tabindex', 0);

		// Add the temp element to the end of the tab box and focus on it.
		data.els.tabBox.appendChild(esc);
		esc.focus();

		// Now that we've moved our focus passed the panels and we're safe, remove the escape element.
		esc.remove();
	}

	/**
	 * Set the active and inactive state for each tab.
	 * 
	 * @param {Number} index 
	 */
	window.USC.tabState = function (index, data) {

		// Loop through all tabs and update their active state.
		data.els.tabs.forEach((tab, i) => {
			const panel = data.els.panels[i];
			const isActive = i === index;
			if (isActive) data.activeIndex = index;

			// Only update the tab and panel if the active state is changing.
			if (tab.classList.contains('active') !== isActive) {
				USC.tabbableToggleActive(tab, panel, isActive, data);
			}
		});

	}

	/**
	 * Handle activating and deactivating tabs and panels. 
	 * 
	 * @param {HTMLElement} el
	 * @param {HTMLElement} panel 
	 * @param {Boolean} active
	 */
	window.USC.tabbableToggleActive = function (el, panel, active, data) {
		// If our current and desired states match, there's nothing to do.
		if (el.classList.contains('active') === active) return;

		// If we're sliding, do some crazy slider stuff...
		if (data.options.slider) USC.slideToggle(panel, active);

		// Add/remove the active class from the tab and it's corresponding panel.
		el.classList.toggle('active', active);
		panel.classList.toggle('active', active);

		// Update the ARIA attributes to reflect the new state.
		el.setAttribute(data.options.tabs ? 'aria-selected' : 'aria-expanded', active);
		panel.setAttribute('aria-hidden', active ? false : true);

		// If we're using secondary tabs, let's update them according to how we did the normal tabs.
		if (data.options.secTabs) {
			const secTab = data.els.secTabs[el.getAttribute('index')];
			if (secTab) {
				secTab.classList.toggle('active', active);
				secTab.setAttribute(data.options.tabs ? 'aria-selected' : 'aria-expanded', active);
			}

			// When deactivating, make sure our focus is on the main tab.
			if (!active) el.focus();

		}

		// If we're marking a panel as active and we have a setup where tabs are in panels, move the focus to the newly opened panel.
		if (active && data.els.tabsInPanels) panel.focus();

		// Trigger any elements that are deferred inside the panel that is active
		if (active) panel.dispatchEvent(new Event('resize'));

		// If we're going active, look to see if there are images we need to show. 
		// The lazy load can't handle images inside of hidden panels so we have to work around it until we can find a better solution.
		if (data.options.lazy && active) {
			if (panel.querySelector('video[data-poster]').length > 0) {
				window.dispatchEvent(new Event('resize'));
			}
		}

		// If we're handling video and we have a video, let's pause it
		if (data.options.video && !active) {
			panel.querySelectorAll("video").forEach(function (el) {
				try { el.pause(); }
				catch (ex) { }
			});
		}

	}

	if (window.register) {
		window.register('usc/p/passive-tabbable-handler');
	}

});