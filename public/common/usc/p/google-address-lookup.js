if ( !window.USC ) { window.USC = {}; }
const reqs = ['usc/p/utils'];
if (!window.google?.maps) reqs.push('googlemap');
require2(reqs, function () {

	/**
	 * Create the googleAddressLookup control.
	 * 
	 * @param {HTMLElement} el 
	 */
	function googleAddressLookup( el ) {

		// Grab the elements
		this.els = {
			form: el,
			search: el.querySelector( 'input[data-ga-search]' )
		}

		this.els.inputs = {};
		var targets = Array.from( this.els.form.querySelectorAll( "[data-ga-target]" ) );
		for ( var i = 0; i < targets.length; i++ ) {
			var input = targets[i],
				field = input.getAttribute( 'data-ga-target' );
			this.els.inputs[field] = input;
		}

		// Set the options using the search input.
		var data = USC.elementData( this.els.search );
		this.options = Object.assign( {}, {}, data );

		// Bind these methods to this instance.
		this.setupSearch = setupSearch.bind( this );

		// Get the search going.
		this.setupSearch();

	}

	/**
	 * Set up and run the search.
	 * 
	 * @param {Event} e 
	 */
	function setupSearch( e ) {

		// Create the Places Control.
		var fullAddress = this.places = new google.maps.places.Autocomplete( this.els.search, this.options );
		var that = this;

		// Listen for the search to be ran
		google.maps.event.addListener( fullAddress, 'place_changed', function () {
			var selectedPlace = fullAddress.getPlace();
			var fieldComponent;
			var secondaryFieldComponent;
			var latitude;
			var longitude;

			var data = {
				fullAddress: fullAddress
			};

			if ( !selectedPlace.geometry ) {
				// No data available.
				return;
			}

			// Run on all the inputs
			var inputs = Object.keys( that.els.inputs );
			for ( var i = 0; i < inputs.length; i++ ) {
				var gaTarget, datainput,
					field = inputs[i],
					datainput = that.els.inputs[field],
					gaTarget = datainput.getAttribute( 'data-ga-target' );

				if ( gaTarget == 'zipcode' ) {

					// Find zip value
					fieldComponent = selectedPlace.address_components.find( function ( address ) {
						return address.types.indexOf( 'postal_code' ) !== -1;
					} );

					datainput.value = ( fieldComponent && fieldComponent.short_name ) || "";

				} else if ( gaTarget == 'address' ) {

					// Find Street value
					fieldComponent = selectedPlace.address_components.find( function ( address ) {
						return address.types.indexOf( 'route' ) !== -1;
					} );

					secondaryFieldComponent = selectedPlace.address_components.find( function ( address ) {
						return address.types.indexOf( 'street_number' ) !== -1;
					} );

                    if ( secondaryFieldComponent ) {
                        datainput.value = secondaryFieldComponent.short_name;
                    }
					
                    if ( fieldComponent ) {
                        ( secondaryFieldComponent ) ? datainput.value += " " + fieldComponent.long_name : datainput.value = fieldComponent.long_name;
                    }

				} else if ( gaTarget == 'city' ) {

					// Find City value
					fieldComponent = selectedPlace.address_components.find( function ( address ) {
						return address.types.indexOf( 'locality' ) !== -1;
					} );

					if ( !fieldComponent ) {
						// if no city, check for sublocality
						fieldComponent = selectedPlace.address_components.find( function ( address ) {
							return address.types.indexOf( 'sublocality' ) !== -1;
						} );
					}

					if ( !fieldComponent ) {
						// if no city, check for neighborhood
						fieldComponent = selectedPlace.address_components.find( function ( address ) {
							return address.types.indexOf( 'neighborhood' ) !== -1;
						} );
					}

					if (!fieldComponent) {
						// if no neighborhood, check for a township 
						fieldComponent = selectedPlace.address_components.find(function (address) {
							return address.types.indexOf('administrative_area_level_3') !== -1;
						});
					}

                    if ( fieldComponent ) {
                        datainput.value = fieldComponent.long_name;
                    }
					
				} else if ( gaTarget == 'state' ) {

					// Find State value
					fieldComponent = selectedPlace.address_components.find( function ( address ) {
						return address.types.indexOf( 'administrative_area_level_1' ) !== -1;
					} );

					datainput.value = fieldComponent.short_name;

				} else if ( gaTarget == 'googleaddress' ) {

					datainput.checked = true;
					datainput.trigger( 'change' );

				} else {
					return;
				}
			} 


		} );
		
	}

	/**
	 * Public googleAddressLookup creation.
	 * 
	 * @param {any} el
	 */
	window.USC.googleAddressLookup = function ( el ) {
		if ( !( el instanceof HTMLElement ) ) {
			throw new Error( "Need an HTMLElement to initialize a googleAddressLookup." )
		} else if ( el.$googleAddressLookup ) {
			console.log( "googleAddressLookup already initialized." );
			return;
		} else {
			el.$googleAddressLookup = new googleAddressLookup( el );
		}
	};

	if ( window.register ) {
		window.register( 'usc/p/google-address-lookup' );
	}

} );