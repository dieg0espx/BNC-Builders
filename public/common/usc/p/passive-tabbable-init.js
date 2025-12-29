if ( !window.USC ) window.USC = {};
require2(['usc/p/passive-tabbable-handler', 'usc/p/usc-utils', 'usc/p/slide-toggle'], () => {

    const defaultOptions = {
        slider: false,
        speed: 500,
        // Are the tabs and their panels siblings or in separate elements?
        siblings: true,
        // Do we want to close an item if it's open and they click the tab again?
        closing: false,
        // Do we want to open items when their tab is hovered?
        hovers: false,
        // Do we want items to stay open once they've been hovered on?
        hoverStay: true,
        // Do you have videos in your items?
        video: false,
        // Do you have images that are being lazy loaded?
        lazy: false,
        // Are we running a stepping form of some sort that needs the tabbable to check validity of inputs between steps?
        stepForm: false,
        // Do we want to be able to move the tabs with next and previous buttons of some sort?
        nextPrev: false,
        // Do we want these to be marked up as tabs? There are times where we want to use the functionality of the tabs without the markup.
        tabs: false
    };
    const touch = window.matchMedia('(hover:none)');

    // Create the Tabbable control.
    class Tabbable {
        constructor(el) {

            // Get our elements.
            this.els = {
                tabBox: el,
                tabs: Array.from(el.querySelectorAll('.el-tab')),
                panels: Array.from(el.querySelectorAll('.el-panel')),
                secTabs: Array.from(el.querySelectorAll('.el-sec-tab')),
                tabbable: []
            };

            // Make sure we have tabs and panels before we move on.
            if (!this.els.panels.length || !this.els.tabs.length) {
                delete this.els.tabBox.$tabbable;
                this.els.tabBox.classList.remove('el-tab-box');
                return;
            }

            // Grab any options the user defined through data attributes.
            // this.options = { ...defaultOptions, ...USC.elementData(el) };  Doing it this way with the spread operator will be possible once the compiler is updated.
            this.options = Object.assign({}, defaultOptions, USC.elementData(el));


            // Let's do it!!!
            this.init();

        }

        init() { 

            // Grab any sub tab boxes so we can remove their elements from our current set and set the subsets up with their own Tabbable.
            this.handleSubs();

            // Check to make sure we don't have non-active panels that are visible as this is an indication we don't need to run.
            if (!this.panelVisCheck(this.els.panels)) {
                delete this.els.tabBox.$tabbable;
                this.els.tabBox.classList.remove('el-tab-box');
                return;
            }

            // Set the active index depending on if the first panel is open or not. 
            this.activeIndex = this.els.panels[0].classList.contains( 'active' ) ? 0 : -1;

            // Check to see if we have secondary tabs.
            if (this.els.secTabs.length) this.options.secTabs = true;

            // If we are using next/prev buttons, find them and store them. 
            if (this.options.nextPrev) {
                this.els.next = this.els.tabBox.querySelector('.el-next-btn');
                this.els.prev = this.els.tabBox.querySelector('.el-prev-btn');
            }

            // Set up the accessibility markup and attributes. 
            this.handleAria();

            // ( Allows for easily changing to an accordion on mobile. )
            // Since the tabs & panels are siblings, let's determine whether or not we want to use sliding.
            // Let's assume we want to slide if the panels are relative in position and we're not using hovers as a control.
            // Since all panels should have the same styles, we'll just check the first one.
            if (getComputedStyle(this.els.panels[0]).position !== 'absolute' && this.options.hovers === false && this.options.siblings) {
                this.options.slider = true;
            }

            // If we want to activate the tabs on hover, bind the events.
            if (this.options.hovers || (!this.options.hovers && !this.options.hoverStay)) {
                // If we're not on a touch device, treat a focusin or a mouseover on a tab as though we clicked it.
                if (!touch.matches && this.options.hovers) {
                    this.els.tabBox.addEventListener('mouseover', USC.tabbableClick.bind(this));
                    this.els.tabBox.addEventListener('focusin', USC.tabbableClick.bind(this));
                }
                if (!this.options.hoverStay) {
                    // When leaving a tab, turn it off.
                    this.els.tabBox.addEventListener('mouseleave', USC.tabbableMouseLeave.bind(this));
                }
            }

        }

        // Look for instances of tabs within our current set to intialize them. 
        handleSubs() {

            // Grabs any sub tab boxes.
            const subs = Array.from(this.els.tabBox.querySelectorAll('.el-tab-box'));

            subs.forEach(sub => {

                // Create a new Tabbable for each subset of tabs.
                sub.$tabbable = sub.$tabbable || new Tabbable(sub);

                // Remove any elements that belong to this nested set of tabs from our current set. 
                this.removeSubs(sub);

            });

        }

        // Remove items from the elements arrays if they belong to a subset of tabs.
        removeSubs(sub) {

            // Loop through each type of element array.
            ['tabs', 'panels', 'secTabs'].forEach(type => {

                // Use the type of element to filter each array and remove any elements that belong to our current subset. 
                this.els[type] = this.els[type].filter(el => {
                    if (el === sub) return true;
                    return !sub.contains(el);
                });

            });
        }

        // Check if any non-active panels are visible (width or height is non-zero) since we don't want to run tabs if our panels aren't hidden.
        panelVisCheck(panels) {
            return !panels.some(panel => {
                return !panel.classList.contains('active') && (panel.offsetWidth > 0 || panel.offsetHeight > 0);
            });
        }

        handleAria() {

            // Check if our tabs are in a list.
            const list = this.els.tabs[0]?.closest('ul');

            // Set the tablist role if we have one and want the tabs markup.
            if (list && this.options.tabs) list.setAttribute('role', 'tablist');

            // If our tabs aren't in a list and we have manually associated elements, let's reorder the arrays.
            // This part assumes the panels are in proper order.
            if (!list && this.els.panels[0]?.id && this.els.tabs[0]?.getAttribute('aria-controls')) {

                // Use map to create newly, reordered sets of tabs and secTabs.
                this.els.tabs = this.els.panels.map(panel => this.findTab(this.els.tabs, panel.getAttribute('id')));
                this.els.secTabs = this.options.secTabs ? this.els.panels.map(panel => this.findTab(this.els.secTabs, panel.getAttribute('id'))) : [];

            }

            // Check if the first tab is contained within any of the panels
            this.els.tabsInPanels = this.els.panels.some( panel => panel.contains(this.els.tabs[0]) || panel.contains(this.els.next) );

            // Loop through the tabs and their panels to set up our starting attributes. 
            this.els.tabs.forEach((tab, i) => {

                // Grab the panel and find the state of the set up.
                const panel = this.els.panels[i];
                const isActive = tab.classList.contains('active');
                const id = panel.id || `${this.els.tabBox.id}_panel_${i}`;

                // Initialize the needed tab attributes.
                const tabAttrs = {
                    'aria-expanded': isActive,
                    'aria-controls': id
                };

                // Initialize the needed panel attributes.
                const panelAttrs = {
                    'aria-hidden': !isActive,
                    tabindex: -1,
                    id: id
                };

                // If we want tabs markup, add those roles in.
                if (this.options.tabs) {
                    tabAttrs.role = 'tab';
                    tabAttrs['aria-selected'] = isActive;
                    delete tabAttrs['aria-expanded'];
                    panelAttrs.role = 'tabpanel';
                }

                // Set the attributes using the helper function from usc-utils.
                USC.setAttributes(tab, tabAttrs);
                if (this.options.secTabs) USC.setAttributes(this.els.secTabs[i], tabAttrs);
                USC.setAttributes(panel, panelAttrs);

            });

            // Navigation buttons setup, if applicable
            if (this.els.next) this.els.next.setAttribute('type', 'button');
            if (this.els.prev) this.els.prev.setAttribute('type', 'button');

        }

        // Helper function to find the correct tab that corresponds to a panel.
        findTab(tabs, id) {
            return tabs.find(tab => tab.getAttribute('aria-controls') === id);
        }

    }


    // Public Tabbable Creation
    window.USC.tabbable = (el) => {
        if (!(el instanceof HTMLElement)) {
            throw new Error("Need an HTMLElement to initialize tabbable.");
        }
        el = el.closest('.el-tab-box') || el;
        el.$tabbable = el.$tabbable || new Tabbable(el);
    };

	if ( window.register ) {
		window.register( 'usc/p/passive-tabbable-init' );
	}

} );