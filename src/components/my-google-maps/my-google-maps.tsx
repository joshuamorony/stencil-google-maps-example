import { Component, Prop, Method } from '@stencil/core';
import { Plugins } from '@capacitor/core';

const { Geolocation, Network } = Plugins;

@Component({
  tag: 'my-google-maps',
  styleUrl: 'my-google-maps.css'
})
export class MyGoogleMaps {
  
  @Prop() apiKey: string;

  public map: any;
  public markers: any[] = [];
  private mapsLoaded: boolean = false;
  private networkHandler = null;

  render() {
    return <div id='google-map-container'></div>
  }

  componentDidLoad() {

    this.init().then(() => {
      console.log("Google Maps ready.")
    }, (err) => { 
      console.log(err);
    });

  }

  init(): Promise<any> {

    return new Promise((resolve, reject) => {

      this.loadSDK().then(() => {

        this.initMap().then(() => {
          resolve(true);
        }, (err) => {
          reject(err);
        });

      }, (err) => {
        
        reject(err);

      });

    });

  }

  loadSDK(): Promise<any> {
    
    console.log("Loading Google Maps SDK");

    return new Promise((resolve, reject) => {

      if(!this.mapsLoaded){

        Network.getStatus().then((status) => {

          if(status.connected){

            this.injectSDK().then(() => {
              resolve(true);
            }, (err) => {
              reject(err);
            });

          } else {

            if(this.networkHandler == null){

              this.networkHandler = Network.addListener('networkStatusChange', (status) => {

                if(status.connected){
  
                  this.networkHandler.remove();

                  this.init().then(() => {
                    console.log("Google Maps ready.")
                  }, (err) => { 
                    console.log(err);
                  });

                }

              });

            }

            reject('Not online');
          }

        }, (err) => {
          
          console.log(err);

          // NOTE: navigator.onLine temporarily required until Network plugin has web implementation
          if(navigator.onLine){

            this.injectSDK().then(() => {
              resolve(true);
            }, (err) => {
              reject(err);
            });

          } else {
            reject('Not online');
          }
  
        });

      } else {
        reject('SDK already loaded');
      }

    });


  }

  injectSDK(): Promise<any> {

    return new Promise((resolve) => {

      window['mapInit'] = () => {
        this.mapsLoaded = true;
        resolve(true);
      }

      let script = document.createElement('script');
      script.id = 'googleMaps';

      if(this.apiKey){
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.apiKey + '&callback=mapInit';
      } else {
        script.src = 'https://maps.googleapis.com/maps/api/js?callback=mapInit';       
      }

      document.body.appendChild(script);

    });

  }

  initMap(): Promise<any> {

    return new Promise((resolve, reject) => {

      Geolocation.getCurrentPosition().then((position) => {

        console.log(position);

        let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        let mapOptions = {
          center: latLng,
          zoom: 15
        };

        this.map = new google.maps.Map(document.getElementById('google-map-container'), mapOptions);
        resolve(true);

      }, () => {

        reject('Could not initialise map');

      });

    });

  }

  @Method()
  addMarker(lat: number, lng: number): void {

    let latLng = new google.maps.LatLng(lat, lng);

    let marker = new google.maps.Marker({
      map: this.map,
      animation: google.maps.Animation.DROP,
      position: latLng
    });

    this.markers.push(marker);

  }

  @Method()
  getCenter(){
    return this.map.getCenter();
  }

}