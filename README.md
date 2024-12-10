# TasteTrip: Food Analyzer

### Aplikasi web dapat diakses di [halaman berikut](http://35.222.70.188:3000/)

### Untuk mengakses secara local, dapat di lakukan melalui tahapan berikut:

1. Siapkan machine learning model di cloud storage bucket
2. Ubah isi konten **.env.example** dan rename menjadi **.env**
3. Instal dependency dengan **npm i**
4. Jalankan aplikasi dengan **npm run start**

### Endpoint API:

/api/predict = (POST) multipart/form-data untuk mengirimkan foto makanan dengan key "image"
