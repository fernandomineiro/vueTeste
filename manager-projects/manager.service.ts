import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ManagerService {

  // API path
  base_path = 'https://api-sandbox.secure.srv.br/spe-n-feature-management';
  base_path2 = 'https://api-sandbox.secure.srv.br/spe-view-n-account'
  base_path3 = 'https://api-sandbox.secure.srv.br/spe-n-store'
  constructor(private http: HttpClient) { }

  // Http Options
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  }

  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    return throwError(
      'Something bad happened; please try again later.');
  };


  getList(): Observable<any> {
    return this.http
      .get<any>(this.base_path + '/v1/feature/all')
      .pipe(
        retry(2),
        catchError(this.handleError)
      )
  }

  
  getAccountNumber(number:Number):Observable<any> {
    return this.http
      .get<any>(this.base_path2 + '/v1/account-payment/account-number/'+number)
      .pipe(
        retry(2),
        catchError(this.handleError)
      )
  }

  createItem(item): Observable<any> {
    return this.http
      .post<any>(this.base_path + '/v1/feature', JSON.stringify(item), this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError)
      )
  }

  updateItem(id, item): Observable<any> {
    return this.http
      .put<any>(this.base_path + '/v1/feature/' + id, JSON.stringify(item), this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError)
      )
  }

  deleteItem(id): Observable<any> {
    return this.http
      .delete<any>(this.base_path + '/v1/feature/' + id, this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError)
      )
  }

  getUuidWhiteLabel():Observable<any> {
    return this.http
      .get<any>(this.base_path3 + '/v1/white-label')
      .pipe(
        retry(2),
        catchError(this.handleError)
      )
  }
}


