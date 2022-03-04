/* global axios bootstrap VeeValidate VeeValidateRules VeeValidateI18n Vue */
// eslint-disable-next-line

const apiUrl = 'https://vue3-course-api.hexschool.io/v2';
const apiPath = 'brunoyu2022';

// VeeValidate.defineRule，為VeeValidate物件的方法，第一個參數為自訂名，第二個參數為方法內容
// 先解構再取出
const {
  defineRule, Form, Field, ErrorMessage, configure,
} = VeeValidate;
const {
  required, email, min, max,
} = VeeValidateRules;
// 引入多國函式的網址
const { localize, loadLocaleFromURL } = VeeValidateI18n;// 物件多國語言
defineRule('required', required);
defineRule('email', email);
defineRule('min', min);// 限制8碼
defineRule('max', max);// 最大是限制10

loadLocaleFromURL('https://unpkg.com/@vee-validate/i18n@4.1.0/dist/locale/zh_TW.json');
configure({ // 用來做一些設定
  // generateMessage是官網定義的方法
  generateMessage: localize('zh_TW'), // 啟用 locale
});

// 由於範例這邊是以ESM 方式只載入Vue的createAPP方法，所以不用寫Vue.createApp
// 若是整包VUE CDN載入，則要寫Vue.createApp
const app = Vue.createApp({
  data() {
    return {
      // 購物車列表
      cartData: {
        carts: [],
      },
      // 產品列表 (客戶購物免登入的API)
      products: [],
      productId: '',
      // 局部讀取效果對應變數
      isLoadingItem: '',
      form: {
        user: {
          name: '',
          email: '',
          tel: '',
          address: '',
        },
        message: '',
      },
      cart: {},
    };
  },
  methods: {
    getProducts() {
      // 注意: 取得產品使用 客戶購物-產品(Products)的API
      // 使用.all的api，等等不會做分頁
      axios.get(`${apiUrl}/api/${apiPath}/products/all`).then((res) => {
        this.products = res.data.products;
      });
    },
    // 查看更多按鈕，對應api為 客戶購物-產品(products)中 GET product/{id}的api
    // 打開產品的視窗
    // 將id帶入，才能對應到要帶出的資料
    openProductModal(id) {
      this.productId = id;
      // 使用$refs調用productModal元件的 openModal()方法
      this.$refs.productModal.id=id;
      this.$refs.productModal.getProduct();
      this.$refs.productModal.openModal();
    },
    // 對應api 客戶購物-購物車(cart)api get方法
    // 取得購物車內的資料
    getCart() {
      axios.get(`${apiUrl}/api/${apiPath}/cart`).then((res) => {
        // 將購物車資料賦值至根元件資料中
        // 購物車api回傳的response物件中有兩層data，2層data後的carts陣列，是為已加入購物車的品項內容(array)
        // carts內品項的 價格有分 total:加入優惠券前 final_total:優惠券打折後最終結帳的價格
        // 所以存取的時候是res.data.data
        this.cartData = res.data.data;
      });
    },
    // 加入購物車按鈕對應方法
    // 對應api 客戶購物-購物車(Cart) POST
    // 注意: 加入購物車需帶入兩個參數 1.id 2.數量
    // 由於購物車頁面上沒有調整數量的欄位，所以第二參數可使用參數預設值帶入
    addToCart(id, qty = 1) {
      // post cart的api資料格式
      const data = {
        product_id: id,
        qty,
      };
      // 局部讀取效果賦值對應id
      this.isLoadingItem = id;
      // axios.post 加入購物車列表
      axios.post(`${apiUrl}/api/${apiPath}/cart`, { data }).then(() => {
        // 重新取得購物車內容
        this.getCart();
        // 將跳出的product-modal元件視窗 在修改完購物車數量後關閉
        this.$refs.productModal.closeModal();
        // 清空局部讀取效果
        this.isLoadingItem = '';
      });
    },
    removeCartAll(){
      this.isLoadingItem='deleteAll'
      axios.delete(`${apiUrl}/api/${apiPath}/carts`).then(() => {
        // 取得購物車的資料
        this.getCart();
        this.isLoadingItem = '';
      });

    },
    // 對應購物車產品列表的 刪除品項 按鈕
    removeCartItem(id) {
      // 記得要帶入對應的item.id
      this.isLoadingItem = id;
      // 注意: 對應的api是購物車的api
      axios.delete(`${apiUrl}/api/${apiPath}/cart/${id}`).then(() => {
        // 取得購物車的資料
        this.getCart();
        this.isLoadingItem = '';
      });
    },
    // 更新數量，使用put cart api
    // 記得直接帶入對應品項
    updateCartItem(item) {
      const data = {
        product_id: item.product.id,
        qty: item.qty,
      };
      this.isLoadingItem = item.id;
      axios.put(`${apiUrl}/api/${apiPath}/cart/${item.id}`, { data }).then(() => {
        // 取得購物車的資料
        this.getCart();
        this.isLoadingItem = '';
      });
    },
    // 驗證 表單觸發方法
    onSubmit() {

      const url = `${apiUrl}/api/${apiPath}/order`;
      const order = this.form;
      axios.post(url, { data: order }).then((response) => {
        alert(response.data.message);
        this.$refs.form.resetForm();
        this.getCart();
      }).catch((err) => {
        alert(err.data.message);
      });
    },
    // 不得為空
    noEmpty(value) {
      if (!value) {
        return '此欄不得為空';
      };
    },
    isPhone(value) {
      const phoneNumber = /^(09)[0-9]{8}$/;
      return phoneNumber.test(value) ? true : '需要正確的電話號碼';
    },
    },
  mounted() {
    // 在生命週期處，先將產品拉下來裝在產品列表內
    this.getProducts();
    // 取得購物車的資料
    this.getCart();
  },
});

// 在product-modal元件內加入BS的方法實體
// 要在mounted生命週期內，一定要加在這的原因是，其show()或hide()的操作dorm元素對象在元件的樣板中
// 所有與modal相關的部分都封裝在這元件內，可用性可大幅提高
app.component('product-modal', {
  // 使用props將openProductModal對應的id帶入，記得使用html做為橋樑，前內後外
  // 記住: props傳入的資料是會即時更新的(若對應的資料改變，傳入的資料也會立即改變)
  // props: ['id'],
  template: '#userProductModal',
  data() {
    return {
      modal: {},
      id:null,
      product: {},
      // 購物車的項目至少要有1個，所以需要填1作為預設值
      qty: 1,
    };
  },
  // watch: {
  //   // 當id有變動時，就觸發在元件內的getProdct()
  //   // 因為id是根元件openProductModal方法傳入的，有變動代表使用者點擊的對象不同
  //   id() {
  //     this.getProduct();
  //   },
  // },
  methods: {
    // 先將modal相關方法放在這邊，之後可以使用this.$refs在其他元件使用
    // 開啟modal方法
    openModal() {
      this.modal.show();
    },
    // 關閉modal方法
    closeModal() {
      this.product={};
      this.modal.hide();
      // 清空後關閉

    },
    // 元件內利用props進來的id(openProductModal方法賦值的id)來取得遠端對應資料
    getProduct() {
      axios.get(`${apiUrl}/api/${apiPath}/product/${this.id}`).then((res) => {
        // 取得對應的單一產品並賦值元件內資料
        this.product = res.data.product;
      });
    },
    // 觸發元件內的addToCart()方法
    // 使用$emit 連結根元件的addToCart方法，注意要帶入兩個參數 1.產品id 2.數量
    addToCart() {
      this.$emit('add-cart', this.product.id, this.qty);
    },
  },
  mounted() {
    // 將BS的Modal方法實體化加入
    // 在js使用this.$refs抓樣板內的dorm元素
    this.modal = new bootstrap.Modal(this.$refs.modal);
    // 若是在外部設let modal=null直到在元件內賦值的話，由於作用域不同，ESLint會顯示紅線，若要在相同作用域使用，則要使用元件內資料變數賦值的方法
  },
});
app.component('VForm', Form);
app.component('VField', Field);
app.component('ErrorMessage', ErrorMessage);

app.mount('#app');
