# Architecture rules

- Patient chart sections use nested routes under `/pacientes/$id/*`; this keeps each clinical section directly addressable and powers the dynamic main-menu submenu.