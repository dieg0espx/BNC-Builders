let bannerRoot;

async function manageCookies() {
	const res = await fetch( '/common/usc/p/manage-cookies.html' );
	const html = await res.text();
	const doc = new DOMParser().parseFromString( html, 'text/html' );
	const host = document.createElement( "div" );
	document.body.appendChild( host );
	bannerRoot = host.attachShadow( { mode: "open" } );
	for ( const node of doc.head.querySelectorAll( "style,link[rel='stylesheet']" ) ) {
		bannerRoot.append( node );
	}
	for ( const node of doc.body.querySelectorAll( ":scope>div" ) ) {
		bannerRoot.append( node );
	}
	init( bannerRoot, host );
}

function setCookies( cook ) {
	if ( cook === "NO!" ) {
		window.location.href = "/no-cookies/?R=" + encodeURIComponent( window.location.href );
		return;
	}

	// Set the cookie value.,
	const date = new Date();
	date.setDate( date.getDate() + 30 );
	const expires = `; expires = ${date.toUTCString()}`;
	let domain = null;
	if ( window.location.host && window.location.host.indexOf( "www." ) === 0 ) {
		domain = window.location.host.substring( 3 );
	}
	document.cookie = `COOK=${cook}; path=/${expires}${domain}`;

	// Manage consent.
	let analytics;
	let marketing;
	if ( navigator.globalPrivacyControl || window.doNotSell ) { analytics = false; marketing = false; }
	else if ( cook === "YES" ) { analytics = true; marketing = true; }
	else if ( cook === "NO!" ) { analytics = false; marketing = false; }
	else if ( cook === "ANALYTICS" ) { analytics = true; marketing = false; }
	else if ( cook === "MARKETING" ) { analytics = false; marketing = true; }
	else { analytics = undefined; marketing = undefined; }
	window.$consentState = { analytics, marketing };
	initConnect();
	window.$afterConsent?.();
}

function initConnect() {
	const span = document.querySelector("span[data-src][data-connect='true']");
	if (span && window.$consentState?.analytics) {
		const src = span.getAttribute("data-src");
		span.remove();
		const script = document.createElement("script");
		script.type = "module";
		script.src = src;
		document.body.appendChild(script);
	}
}

function init( shadowRoot, host ) {
	const cookieBanner = shadowRoot.getElementById("cookieBanner");
	const cookieModal = shadowRoot.getElementById("cookieModal");
	const overlay = shadowRoot.getElementById( "overlay" );

	function showBanner() {
		document.body.classList.add("has-cap-banner");
		cookieBanner.classList.add("active");
		requestAnimationFrame(() => {
			moveADA();
			moveAE();
			moveScorpionConnect();
		});
	}

	function closeBanner() {
		cookieBanner.remove();
		document.body.classList.remove("has-cap-banner");
		if (cookieModal.matches(".cookie-modal--active")) {
			closeModal();
		}
	}

	let lastFocusedElement;
	function closeModal() {
		cookieModal.classList.remove( "cookie-modal--active" );
		overlay.classList.remove( "overlay--active" );
		lastFocusedElement?.focus();
		lastFocusedElement = null;
		document.removeEventListener( "keydown", closeOnEscape );
	}
	const closeOnEscape = e => e.key === "Escape" && closeModal();

	function openModal() {
		// Set current state.
		const analytics = shadowRoot.getElementById("analyticsToggle");
		const marketing = shadowRoot.getElementById("marketingToggle");
		analytics.checked = window.$consentState?.analytics !== false;
		if (typeof window.$consentState?.marketing === "boolean") {
			marketing.checked = window.$consentState.marketing;
		} else if (navigator.globalPrivacyControl || window.doNotSell) {
			marketing.checked = false;
		} else {
			marketing.checked = true;
		}

		lastFocusedElement = document.activeElement;
		cookieModal.classList.add( "cookie-modal--active" );
		overlay.classList.add( "overlay--active" );
		const close = cookieModal.querySelector( "button[data-action='CloseModal']" );
		setTimeout( () => close.focus(), 100 );
		document.addEventListener( "keydown", closeOnEscape );
	}

	function saveChoices() {
		const analytics = shadowRoot.getElementById( "analyticsToggle" ).checked;
		const marketing = shadowRoot.getElementById( "marketingToggle" ).checked;
		if ( analytics && marketing ) {
			setCookies( "YES" );
		} else if ( analytics ) {
			setCookies( "ANALYTICS" );
		} else if ( marketing ) {
			setCookies( "MARKETING" );
		} else {
			setCookies( "NO!" );
		}
	}

	shadowRoot.addEventListener( "click", e => {
		const action = e.target.closest( "[data-action]" )?.getAttribute( "data-action" );
		switch ( action ) {
			case "Accept":
				setCookies( "YES" );
				closeBanner();
				break;
			case "Manage":
				openModal();
				break;
			case "DoNotSell":
				setCookies( "ANALYTICS" );
				closeBanner();
				break;
			case "CloseBanner":
				closeBanner();
				break;
			case "CloseModal":
				closeModal();
				break;
			case "SaveChoices":
				saveChoices();
				closeBanner();
				break;
		}
	} );

	host.addEventListener( "wheel", ( e ) => {
		e.preventDefault();
		e.stopPropagation();
	}, { passive: false } );

	const accordionHeaders = shadowRoot.querySelectorAll( ".accordion__header" );
	const allAccordionContent = shadowRoot.querySelectorAll( ".accordion__content" );
	allAccordionContent.forEach( ( content ) => {
		const isExpanded =
			content.previousElementSibling.getAttribute(
				"aria-expanded"
			) === "true";
		content.setAttribute(
			"aria-hidden",
			!isExpanded ? "true" : "false"
		);
	} );
	accordionHeaders.forEach( ( header ) => {
		header.addEventListener( "click", function ( e ) {
			if ( e.target.closest( ".accordion__toggle" ) ) {
				return;
			}

			const isExpanded = this.getAttribute( "aria-expanded" ) === "true";
			const content = this.nextElementSibling;

			accordionHeaders.forEach( ( h ) => {
				h.setAttribute( "aria-expanded", "false" );
				const c = h.nextElementSibling;
				c.classList.remove( "accordion__content--expanded" );
				c.setAttribute( "aria-hidden", "true" );
			} );

			if ( !isExpanded ) {
				this.setAttribute( "aria-expanded", "true" );
				content.classList.add( "accordion__content--expanded" );
				content.setAttribute( "aria-hidden", "false" );
			}
		} );
	} );

	// Trap focus inside modal
	cookieModal.addEventListener( "keydown", function ( e ) {
		if ( e.key === "Tab" ) {
			const focusableElements = cookieModal.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const firstElement = focusableElements[0];
			const lastElement =
				focusableElements[focusableElements.length - 1];

			if ( e.shiftKey ) {
				if ( shadowRoot.activeElement === firstElement ) {
					lastElement.focus();
					e.preventDefault();
				}
			} else {
				if ( shadowRoot.activeElement === lastElement ) {
					firstElement.focus();
					e.preventDefault();
				}
			}
		}
	} );

	// Expose this as a public method.
	window.$showPrivacy = openModal;

	if (window.$consentState?.marketing === undefined) {
		showBanner();
	} else {
		closeBanner();
		initConnect();
	}
}

function moveADA() {
	const fltr = document.querySelector( ".acc-opt .fltr" );
	if ( !fltr ) {
		return;
	}
	let style = document.head.querySelector( "style[data-cap]" );
	if ( !style ) {
		style = document.createElement( "style" );
		style.setAttribute( "data-cap", "" );
		document.head.appendChild( style );
	}
	const cookieBanner = bannerRoot?.getElementById( "cookieBanner" );
	const height = cookieBanner?.offsetHeight || 74;
	const bottom = parseFloat( getComputedStyle( fltr ).getPropertyValue( "bottom" ) ) || 0;
	style.innerHTML = `
body.has-cap-banner .acc-opt .fltr {
	bottom: ${bottom + height}px !important;
}`;
}

function moveAE() {
	let style = document.head.querySelector("style[data-ae]");
	if (!style) {
		style = document.createElement("style");
		style.setAttribute("data-ae", "");
		document.head.appendChild(style);
	}
	const cookieBanner = bannerRoot?.getElementById("cookieBanner");
	const height = cookieBanner?.offsetHeight || 74;
	style.innerHTML = `
body.has-cap-banner #ae_launcher {
	bottom: ${height}px !important;
}`;
}

let detectConnectCounter = 0;
function moveScorpionConnect() {
	if ( ++detectConnectCounter >= 25 ) {
		return;
	}
	const cookieBanner = bannerRoot?.getElementById( "cookieBanner" );
	const height = cookieBanner?.offsetHeight || 74;
	if ( !setConnectBottom( height ) ) {
		setTimeout( moveScorpionConnect, 250 );
	}
}

function setConnectBottom( height ) {
	const node = document.getElementById( "scorpion_connect" );
	const root = node?.shadowRoot;
	const style = root?.querySelector( "style" );
	if ( style ) {
		const sheet = [...root.styleSheets].find( s => !s.ownerNode.getAttribute( "href" ) );
		if ( sheet ) {
			let rule = [...sheet.cssRules].find( r => r.selectorText === ":host-context(body.has-cap-banner) .scorpion-connect" );
			if ( !rule ) {
				const index = sheet.insertRule( ":host-context(body.has-cap-banner) .scorpion-connect {}", sheet.cssRules.length );
				rule = sheet.cssRules[index];
			}
			rule.style.setProperty( "bottom", `${height}px` );
			return true;
		}
	}
	return false;
}

function deleteAllCookies() {
	const cookies = document.cookie.split( ";" );
	const domainParts = window.location.hostname.split( "." );
	const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT; ";
	for ( const cookie of cookies ) {
		const eqPos = cookie.indexOf( "=" );
		const name = eqPos > -1
			? cookie.substring( 0, eqPos ).trim()
			: cookie.trim();

		const pathParts = location.pathname.split( '/' );
		let pathCurrent = "";

		for ( let i = 0; i < pathParts.length; i++ ) {
			pathCurrent += ( i > 0 ? "/" : "" ) + pathParts[i];
			let domainAccum = domainParts.slice();
			while ( domainAccum.length > 0 ) {
				const domain = domainAccum.join( "." );
				document.cookie = `${name}=; ${expires}path=${pathCurrent}; domain=${domain};`;
				domainAccum.shift();
			}
			document.cookie = `${name}=; ${expires}path=${pathCurrent};`;
		}
		document.cookie = `${name}=; ${expires}path=/;`;
	}
}

manageCookies();