alter table pix_charges
  add column if not exists fbc  text,
  add column if not exists fbp  text;
