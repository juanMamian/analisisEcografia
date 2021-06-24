import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false;

var local=window.location.href.substring(7, 16);


const serverUrl=process.env.NODE_ENV === 'production' && local!="localhost"
? 'https://fhr-eco.herokuapp.com'
: 'http://localhost:3000'

Vue.mixin({
  data(){
    return {
      serverUrl
    }
  }
})

new Vue({
  render: h => h(App),
}).$mount('#app')
