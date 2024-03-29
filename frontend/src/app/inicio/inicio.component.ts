import { Component, OnInit } from '@angular/core';
import { Usuario, UsuarioService } from '../servicios/usuario.service';
import { Permiso, } from '../servicios/permiso.service';
import {Router} from "@angular/router";
import { HttpErrorResponse } from '@angular/common/http';
import { Observer } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent implements OnInit {

  registrandose=false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {}

  intentarIngresar(e:SubmitEvent){
    e.preventDefault();
    
    let form:HTMLFormElement=e.target as HTMLFormElement;
    form['submit-button'].disabled = true;
    this.usuarioService
      .ingresar(form['usuario'].value,form['contrasenia'].value)
      .subscribe(
        {
          next:(u:any) =>{
            this.router.navigate(['/panel'])
          }
          ,error:(err: HttpErrorResponse) => {
            this.toastr.error(err.error);
            form['submit-button'].disabled = false;
          }
        }
      );
  }

  // TODO UX: No se cierra el modal al clickear a los lados
  cerrarModal(t:EventTarget|null){
    this.registrandose=(t as HTMLElement).id!='modal';
  }

  registrarse(e:SubmitEvent){
    e.preventDefault();

    let form=e.target as HTMLFormElement;

    form['submit-button'].disabled = true;

    let u: Usuario=(((Object.fromEntries((new FormData(form))))) as unknown) as Usuario;

    // TODO Feature que funcione bien. Ahora mismo se crea y todo pero se reinicia la página
    this.usuarioService
      .create(u)
      .subscribe({
        next:(result:any)=>{
          (document.getElementById('usuario') as HTMLInputElement).value = u.nombreUsuario;
          (document.getElementById('contrasenia') as HTMLInputElement).value = u.contrasenia||'';
          (document.getElementById('ingresar') as HTMLFormElement).submit();
        }
        ,error:(err: HttpErrorResponse)=>{
          this.toastr.error(err.error);
          form['submit-button'].disabled = false;
        }
      });
  }

}
