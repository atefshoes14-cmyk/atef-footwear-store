with source_products(title, description, category, price, sale_price, image_url) as (
  values
    ('حذاء أكسفورد كلاسيك جلد', 'حذاء رجالي جلدي أنيق للدوام والمناسبات.', 'men', 1890::numeric, null::numeric, 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1000&q=80'),
    ('سنيكرز أبيض يومي', 'سنيكرز مريح بتصميم بسيط للاستخدام اليومي.', 'men', 1450::numeric, 1190::numeric, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80'),
    ('حذاء كعب أنيق', 'كعب حريمي راقٍ بلمسة كلاسيكية للمناسبات.', 'women', 1750::numeric, null::numeric, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80'),
    ('صندل حريمي بيج', 'صندل خفيف وأنيق بخامة ناعمة وإطلالة صيفية.', 'women', 1290::numeric, 990::numeric, 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=1000&q=80'),
    ('سنيكرز أطفال ملوّن', 'حذاء أطفال مريح بخفة حركة وتصميم مرح.', 'kids', 890::numeric, null::numeric, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=80'),
    ('حقيبة يد جلدية', 'حقيبة يد عملية بلمسة أنيقة للاستخدام اليومي.', 'bags', 1590::numeric, 1390::numeric, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80')
), inserted_products as (
  insert into public.products(title, description, category, price, sale_price, is_active)
  select source_products.title, source_products.description, source_products.category, source_products.price, source_products.sale_price, true
  from source_products
  where not exists (select 1 from public.products where products.title = source_products.title)
  returning id, title
), inserted_images as (
  insert into public.product_images(product_id, storage_path, public_url, sort_order)
  select inserted_products.id, 'external/seed/' || replace(lower(inserted_products.title), ' ', '-'), source_products.image_url, 0
  from inserted_products join source_products using (title)
  returning product_id
)
insert into public.product_variants(product_id, size, color, stock_quantity)
select inserted_products.id, variants.size, variants.color, variants.stock_quantity
from inserted_products
join (values
  ('حذاء أكسفورد كلاسيك جلد', '41', 'بني', 8), ('حذاء أكسفورد كلاسيك جلد', '42', 'أسود', 7),
  ('سنيكرز أبيض يومي', '40', 'أبيض', 10), ('سنيكرز أبيض يومي', '42', 'أبيض', 12),
  ('حذاء كعب أنيق', '37', 'بيج', 6), ('حذاء كعب أنيق', '39', 'أسود', 5),
  ('صندل حريمي بيج', '37', 'بيج', 9), ('صندل حريمي بيج', '38', 'بيج', 8),
  ('سنيكرز أطفال ملوّن', '36', 'أزرق', 8), ('سنيكرز أطفال ملوّن', '37', 'أزرق', 7),
  ('حقيبة يد جلدية', 'N/A', 'عنابي', 10), ('حقيبة يد جلدية', 'N/A', 'بيج', 6)
) as variants(title, size, color, stock_quantity) using (title);
