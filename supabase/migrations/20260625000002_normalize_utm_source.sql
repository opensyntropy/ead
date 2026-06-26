-- Normaliza abreviações do Meta em registros históricos
update public.page_visits  set utm_source = 'instagram'        where utm_source = 'ig';
update public.page_visits  set utm_source = 'facebook'         where utm_source = 'fb';
update public.page_visits  set utm_source = 'audience_network' where utm_source = 'an';
update public.page_visits  set utm_source = 'messenger'        where utm_source = 'msg';

update public.pix_charges  set utm_source = 'instagram'        where utm_source = 'ig';
update public.pix_charges  set utm_source = 'facebook'         where utm_source = 'fb';
update public.pix_charges  set utm_source = 'audience_network' where utm_source = 'an';
update public.pix_charges  set utm_source = 'messenger'        where utm_source = 'msg';
