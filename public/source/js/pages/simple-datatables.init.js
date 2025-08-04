/*
Template Name: Blightstone - Responsive Bootstrap 5 Admin Dashboard
Author: Blightstone
Version: 1.0.0
Website: https://blightstone.com/
File: simpleDatatables init Js
*/

try {
  new simpleDatatables.DataTable("#datatable_1", {
    searchable: false,
    fixedHeight: true,
  });
} catch (e) {}
