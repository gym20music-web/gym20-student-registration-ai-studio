-- GYM20 secure admin panel + public page configuration
-- Run this file once in Supabase SQL Editor.
-- Public visitors can read ONLY the single public_site_config row.
-- Only an active owner (gym20.is_active_owner()) can change site settings.

begin;

alter table gym20.site_settings enable row level security;
grant usage on schema gym20 to anon, authenticated;
grant select on table gym20.site_settings to anon;
grant select, insert, update, delete on table gym20.site_settings to authenticated;

drop policy if exists public_read_site_config on gym20.site_settings;
create policy public_read_site_config
on gym20.site_settings
for select
to anon
using ("key" = 'public_site_config');

drop policy if exists owner_manage_all on gym20.site_settings;
create policy owner_manage_all
on gym20.site_settings
for all
to authenticated
using (gym20.is_active_owner())
with check (gym20.is_active_owner());

-- Seed defaults only if this settings key does not already exist.
-- Existing admin-edited settings are preserved.
insert into gym20.site_settings ("key", "value")
values ('public_site_config', '{"cacheVersion":13,"brandTag":"آکادمی تخصصی ورزش GYM20🤸","bannerTitle":"سلام، وقتتون بخیر 🌱","bannerSubtitle":"شرایط برگزاری کلاس‌های ورزشی تخصصی | انتخاب سبک‌ها و محاسبه هوشمند شهریه","bannerBg":"","kidsBase":1500000,"adultBase":2000000,"extraStylePrice":500000,"multipliers":{"normal":1,"semi":1.4,"private":2,"vip":3},"sessionRates":{"8":1,"10":1.25,"12":1.5},"card":{"bank":"بانک سامان","number":"6219-8610-2234-5678","cleanNumber":"6219861022345678","owner":"به نام: مربی ورزشی","gatewayLink":"https://zarinp.al/"},"contact":{"phone":"09059293060","instagram":"https://instagram.com/","telegram":"https://t.me/"},"musicChannel":{"name":"کانال موزیک GYM20MUSIC","id":"@GYM20MUSIC","link":"https://t.me/GYM20MUSIC","avatar":"music.jpg"},"styles":[{"id":"ninjutsu","name":"نینجوتسو 🥋"},{"id":"parkour","name":"پارکور 🏃‍♂️"},{"id":"calisthenics","name":"کلیستنیکس 🤸‍♂️"},{"id":"breakdance","name":"بریک‌دنس (پاورموو) ⚡"},{"id":"boxing","name":"بوکس خیابانی 🥊"},{"id":"kyokushin","name":"کیوکوشین 🥋"}],"rules":{"normal":"• کلاس عمومی با ظرفیت استاندارد سالن برگزار می‌شود.\n• روزها و ساعت کلاس ابتدای هر ماه فیکس و هماهنگ می‌شود.\n• عدم امکان جابجایی جلسه به دلیل اشتراکی بودن تایم سالن.","semi":"• ظرفیت محدود (۳ تا ۵ نفر) با بازدهی و نظارت آموزشی بالاتر.\n• با هماهنگی سایر اعضا، ۱ جلسه در طول ترم امکان جابجایی ساعت دارد.","private":"• کلاس کاملاً اختصاصی و تک‌نفره متمرکز بر سرعت پیشرفت هنرجو.\n• امکان تغییر ساعت کلاس با هماهنگی قبلی (حداقل ۲۴ ساعت قبل).","vip":"👑 شرایط اختصاصی پکیج VIP:\n• تایم کاملاً منعطف و اولویت رزرو تایم‌های طلایی سالن.\n• ارائه برنامه تمرین مکمل و بدنسازی اختصاصی در منزل.\n• پشتیبانی و آنالیز ویدیویی تکنیک‌ها در پیام‌رسان توسط مربی.\n• امکان جبرانی ۲ جلسه غیبت موجه در طول دوره.","s8":"• ترم ۸ جلسه‌ای: هفته‌ای ۲ بار، مدت هر جلسه ۱ ساعت (مهلت استفاده: حداکثر ۳۰ روز).","s10":"• ترم ۱۰ جلسه‌ای: هفته‌ای ۲ الی ۳ جلسه (مهلت استفاده: حداکثر ۳۵ روز).","s12":"• ترم ۱۲ جلسه‌ای (فشرده/حرفه‌ای): هفته‌ای ۳ بار منظم (مهلت استفاده: حداکثر ۴۰ روز).","general":"• حضور ۱۰ دقیقه قبل از شروع کلاس الزامی است.\n• غیبت بدون اطلاع قبلی سوخت جلسه محسوب می‌شود.\n• همراه داشتن بطری آب و لباس مناسب الزامی است."}}'::jsonb)
on conflict ("key") do nothing;

notify pgrst, 'reload schema';
commit;

-- Verify the public config key exists (do not share other site_settings rows publicly):
select "key", jsonb_typeof("value") as value_type
from gym20.site_settings
where "key" = 'public_site_config';
