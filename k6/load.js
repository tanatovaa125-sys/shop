import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:8080';
const VUS = parseInt(__ENV.VUS || '50');
const PRODUCTS = 200000;
const HOT = 1000;

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 409));

export const options = {
  stages: [
    { duration: '15s', target: Math.round(VUS / 2) },
    { duration: '45s', target: VUS },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    'http_req_duration{name:product}': ['p(95)<10000'],
    'http_req_duration{name:list}': ['p(95)<10000'],
    'http_req_duration{name:top}': ['p(95)<10000'],
    'http_req_duration{name:search}': ['p(95)<10000'],
    'http_req_duration{name:order}': ['p(95)<10000'],
  },
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function productId() {
  return Math.random() < 0.8 ? rand(1, HOT) : rand(1, PRODUCTS);
}

export default function () {
  const r = Math.random();
  let res;

  if (r < 0.60) {
    res = http.get(`${BASE}/products/${productId()}`, { tags: { name: 'product' } });
  } else if (r < 0.80) {
    res = http.get(`${BASE}/products?category_id=${rand(1, 50)}&limit=20`, { tags: { name: 'list' } });
  } else if (r < 0.90) {
    res = http.get(`${BASE}/stats/top-products`, { tags: { name: 'top' } });
  } else if (r < 0.95) {
    const q = Math.random().toString(16).substring(2, 5);
    res = http.get(`${BASE}/products/search?q=${q}`, { tags: { name: 'search' } });
  } else {
    res = http.post(
      `${BASE}/orders`,
      JSON.stringify({ product_id: productId(), quantity: 1 }),
      { headers: { 'Content-Type': 'application/json' }, tags: { name: 'order' } },
    );
  }

  check(res, { 'ответ получен': (x) => x.status >= 200 && x.status < 500 });
  sleep(0.1);
}