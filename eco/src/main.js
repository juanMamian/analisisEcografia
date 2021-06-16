import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

const serverUrl=process.env.NODE_ENV === 'production'
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
