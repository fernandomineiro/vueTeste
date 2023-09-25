import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgbCalendar, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { AmountStatusResponse, PreImplantationResponse, PreImplantationService, Status } from '@wlp/ui-bs-implantation';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as xlsx from 'xlsx';
import { ManagerService } from './manager.service'
import {ActivatedRoute, ChildActivationStart, Router} from '@angular/router';
import { ImplantationManagementService } from '@wlp/ui-bs-config-edit';
import { FormControl, FormGroup, Validators } from '@angular/forms';

class Account {
  partner: any;
  numberAccout: any;
  category: string;
  type: string;
  status: string;
}


const equals = (one: NgbDateStruct, two: NgbDateStruct) =>
  one && two && two.year === one.year && two.month === one.month && two.day === one.day;

const before = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two
    ? false
    : one.year === two.year
      ? one.month === two.month
        ? one.day === two.day
          ? false
          : one.day < two.day
        : one.month < two.month
      : one.year < two.year;

const after = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two
    ? false
    : one.year === two.year
      ? one.month === two.month
        ? one.day === two.day
          ? false
          : one.day > two.day
        : one.month > two.month
      : one.year > two.year;


@Component({
  selector: 'kt-manager-projects',
  templateUrl: './manager-project.component.html',
  styleUrls: ['./manager-project.component.scss'],
})

export class ManagerProjectListComponent implements OnInit {
  displayedColumns = ['client', 'cnpj','title', 'category', 'aplication', 'status', 'action'];
  dataSource: any;
  dataTable:any;
  hoveredDate: NgbDateStruct;
  fromDate: NgbDateStruct;
  toDate: NgbDateStruct;
  datePicker: boolean;
  implantation: PreImplantationResponse[];
  amountInPlantation: AmountStatusResponse;
  amountActive: AmountStatusResponse;
  amountInactive: AmountStatusResponse;
  nameModal: any;
  typeMOdal:any;
  newSearch: Boolean = false;
  partnerList: Array<any> = [] 
  data: Account;
  categoryList: Array<any> = ['MENU', 'PAGE', 'BROWSER'] 
  categoryType: Array<any> = ['Webbanking', 'App', 'Backoffice'] 
  categoryStatus: Array<any> = [{name: 'Ativo', type: 'Ativo'}, {name: 'Desativado', type: 'Inativo'}]  
  bioSection = new FormGroup({
    uuidAccountPayment: new FormControl(null),
    uuidWhitelabel: new FormControl(''),
    accountNumber: new FormControl(''),
    title: new FormControl('', [Validators.required]),
    category: new FormControl('',),
    aplication: new FormControl(''),
    status: new FormControl(''),
    sequenceApp: new FormControl(''),
    sequenceWeb: new FormControl(''),
    sequenceBackoffice: new FormControl(''),
    description: new FormControl('',[Validators.required]),
    iconWeb: new FormControl(''),
    iconApp: new FormControl(''),
    iconBackoffice: new FormControl(''),
    label: new FormControl(''),
    url: new FormControl(''),
    parameters: new FormControl(''),
    inactiveMessage: new FormControl(''),
    showApp: new FormControl(''),
    showWeb: new FormControl(''),
    showBo: new FormControl(''),
    applyBackend: new FormControl(''),
    uuid: new FormControl(''),
    uuidParent: new FormControl(''),
  });
  valueUuidWhitelabel:any[] = []; 
  valueAccount:any [] = [];
  aplicationValue: any[] = ['App', 'Webbanking', 'Backoffice'];
  categoryValue: any[] = ['MENU', 'SUBMENU', 'PAGE', 'BROWSER'];
  descricaoValue: any[]= ['HOME',
    'PROFILE',
    'PIX',
    'STATEMENT',
    'PAYMENT',
    'RECHARGEBILLIT',
    'CELLRECHARGE',
    'RECEIPT',
    'TRANSFER',
    'ACCOUNTUSERS',
    'STATIC',
    'ONUS',
    'BILLETLIQUIDATION',
    'CARD',
    'BILLET']
  typeForm:Number = 1;
  pagination: Boolean = true
  name:any;
  uuid:any;
  selected: any;
  selectedCategory:any;
  selectedLabel:any;
  typeStatus:any[] = ['ACTIVE', 'INACTIVE']
  openApp:Boolean = false
  openWebbanking:Boolean = false
  openBackoffice:Boolean = false
  openMenu:Boolean = false
  openSubMenu:Boolean = false
  itensSubMenu:any [] = []
  loading: Boolean
  selectedUuidWhitelabel: any = null
  status: Boolean = true
  public modeselect = 'Ativo';
  public modeselectParceiro = 'nenhum'

    

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('sort1') sort: MatSort;
  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild('element', { static: false }) element: ElementRef;
  selectedCity: string;
  selectedCity2: string;

  constructor(calendar: NgbCalendar,
    protected cd: ChangeDetectorRef,
              private activatedRoute: ActivatedRoute,
    private preImplantationService: PreImplantationService,
    private implantationManagementService: ImplantationManagementService,
    public managerService: ManagerService,
    private router: Router) {
    this.data = new Account()
    this.fromDate = calendar.getToday();
    this.toDate = calendar.getNext(calendar.getToday(), 'd', 10);

    
  }

  ngOnInit() {
    this.loading = true

    this.selectedCity = 'MENU';
    this.selectedCity2 = 'PROFILE';
    this.datePicker = false;
    this.loadUuidWhiteLabel()
    
    this.loadingInImplantation();
    this.loadingActive();
    this.loadingInactive();


    this.cd.markForCheck()
  }

  loadUuidWhiteLabel(){
    this.managerService.getUuidWhiteLabel().subscribe((data) => {

      this.valueUuidWhitelabel = data


   
      this.loadingDate();
      

     },
    (error) => {
       alert(error)
    })
  }

  selectAplicarion(){
    
    console.log(this.bioSection.value.aplication)

    this.openApp = this.bioSection.value.aplication.includes('App')
    this.openWebbanking = this.bioSection.value.aplication.includes('Webbanking')
    this.openBackoffice = this.bioSection.value.aplication.includes('Backoffice')

  }

  selectCategory(){
    this.openMenu = this.bioSection.value.category == 'MENU' ? false : true

    this.openSubMenu = this.bioSection.value.category == 'SUBMENU' ? true : false

    let tipoMenu = this.bioSection.value.category == 'SUBMENU' ? true : false

    if(tipoMenu){
      this.itensSubMenu = []
      this.implantation.filter((value:any)=>{
        value.category == 'MENU' ? this.itensSubMenu.push(value) : null
      })
    }

    console.log(this.itensSubMenu)
  }

  loadingDate(){
    this.managerService.getList().pipe(
      tap(res => {


       
        Object.values(res.data).forEach((value) =>{
          // this.valueUuidWhitelabel.includes(value['uuidWhitelabel']) ? null : this.valueUuidWhitelabel.push(value['uuidWhitelabel'])
          this.valueAccount.includes(value['accountNumber']) ? null : this.valueAccount.push(value['accountNumber'])
          
          
          // let posiWhitelabel = this.valueUuidWhitelabel.indexOf(undefined)
          // this.valueUuidWhitelabel[posiWhitelabel] = "Para todos"


      
          let aplication = ''
          if(value['showApp'] == true && value['showWeb'] == false && value['showBo'] == false){
            aplication += "App" 
          }
          if(value['showApp'] == true && value['showWeb'] == true || value['showBo'] == true){
            aplication += "App, " 
          }
          if(value['showWeb'] == true && value['showBo'] == false){
            aplication += "Webbanking" 
          }
          if(value['showWeb'] == true && value['showBo'] == true){
            aplication += "Webbanking, " 
          }
          if(value['showBo'] == true){
            aplication += "Backoffice " 
          }

          
          value['aplication'] = aplication
         
          
          
        });

        let posiAccount = this.valueAccount.indexOf(undefined)
        this.valueAccount[posiAccount] = "Para todos"

        // let posivalueUuidWhitelabel = this.valueUuidWhitelabel.indexOf(null)
        // this.valueUuidWhitelabel[posivalueUuidWhitelabel] = "Para todos"
     
        this.implantation = res.data;
       

        this.implantation.forEach(element => {
          element.color = this.preImplantationService.implantationColor(element.status);
          element.status = this.preImplantationService.implantationTranslate(element.status);
          if(element.uuidWhitelabel != null){
            let answer = this.valueUuidWhitelabel.filter((value)=>value.uuid == element.uuidWhitelabel)
   
            element.uuidWhitelabel = answer[0].name
          }
          this.partnerList.includes(element.uuidWhitelabel) == true ? null : this.partnerList.push(element.uuidWhitelabel)
          
          this.partnerList.forEach((value)=>{
           
            if(value == null){
              let position = this.partnerList.indexOf(value)
              let change = this.partnerList[0]
              this.partnerList[0] = value
              this.partnerList[position] = change
            }
          })
         
        })
      

        this.dataSource = new MatTableDataSource(this.implantation);
        this.dataTable = new MatTableDataSource(this.implantation);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false


        
        this.cd.markForCheck()

      }),
      catchError(_ => {
        return of(null);
      }),
    ).subscribe();
   
  }

  ngAfterViewInit() {
    /*  this.dataSource.paginator = this.paginator; */
  }


  changeFunction() {

    if(this.bioSection.value.aplication == null){
      alert('Preencher o campo aplicação')
    }
    else if(this.bioSection.value.description ==  null){
      alert('Preencher o campo descrição')
    }

    else if(this.bioSection.value.title == null){
      alert('Preencher o campo título')
    }
    else{
   
     this.bioSection.value.applyBackend = true

     this.bioSection.value.aplication.includes('Web')? this.bioSection.value.showWeb = true : this.bioSection.value.showWeb = false
     this.bioSection.value.aplication.includes('App')? this.bioSection.value.showApp = true : this.bioSection.value.showApp = false
     this.bioSection.value.aplication.includes('Backoffice')? this.bioSection.value.showBo = true : this.bioSection.value.showBo = false
     delete this.bioSection.value.aplication;



     this.managerService.getAccountNumber(this.bioSection.value.accountNumber).subscribe((response)=>{

      this.bioSection.value.uuidAccountPayment = response == null ? null : response.uuid

    

      delete this.bioSection.value.accountNumber;

      let answer = this.valueUuidWhitelabel.filter((value)=> value.uuid== this.bioSection.value.uuidWhitelabel)


      
      this.bioSection.value.uuidWhitelabel = answer[0] != null ?  answer[0].uuid : null 
 

 
 
      this.managerService.updateItem(this.bioSection.value.uuid, this.bioSection.value).subscribe(
        (data) => {
      
          
          this.ngOnInit()
          this.typeForm = 1
         },
        (error) => {
           alert(error)
        }
        
      )
      
     })

     
    //  delete this.bioSection.value.uuid;


  }

    

  }

  callingFunction() {

  

    if(this.bioSection.value.aplication == null){
      alert('Preencher o campo aplicação')
    }
    else if(this.bioSection.value.description ==  null){
      alert('Preencher o campo descrição')
    }

    else if(this.bioSection.value.title == null){
      alert('Preencher o campo título')
    }

   

    else{
      this.bioSection.value.applyBackend = true
      this.bioSection.value.aplication.includes('Web')? this.bioSection.value.showWeb = true : 
      (
      this.bioSection.value.showWeb = false, this.bioSection.value.iconWeb = null, this.bioSection.value.iconApp = null)
      this.bioSection.value.aplication.includes('App')? this.bioSection.value.showApp = true :( 
        this.bioSection.value.showApp = false, this.bioSection.value.iconApp = null, this.bioSection.value.sequenceWeb = null)
      this.openBackoffice == true ? this.bioSection.value.showBo = true : (this.bioSection.value.showBo = false,
        this.bioSection.value.iconBackoffice = null, this.bioSection.value.sequenceBackoffice = false)
      
      
      
      
        delete this.bioSection.value.aplication;
  
      this.managerService.getAccountNumber(this.bioSection.value.accountNumber).subscribe((response)=>{
  
        //se não tiver conta, mandar msg
        response == null ? this.bioSection.value.uuidAccountPayment = null : this.bioSection.value.uuidAccountPayment = response?.uuid == '' ? null : response.uuid
        
  
        console.log(this.bioSection.value)
  
        //  this.managerService.createItem(this.bioSection.value).subscribe(
        //    (data) => {
        //      this.typeForm = 1
        //       this.ngOnInit()
             
        //     },
        //    (error) => {
        //       console.log(error)
        //   }
        //  )
      })
    }

   


    //  
   }

  verifySearch(){
    this.newSearch = !this.newSearch
  }
  deleteAccount(){
    
    this.managerService.deleteItem(this.uuid).subscribe(
      (data) => {
    
         this.ngOnInit()
       },
      (error) => {
         alert(error)
      }
    )
    
    

  }

  openModal(typo:number, name:any, id:any){

    this.uuid = id
   
     this.nameModal = 'Deletar conta'
     name == undefined ? this.name = "Sem número" : this.name = name

  }

  modal(id:any, itens:any = null){

    this.bioSection.reset()    
    
    this.typeForm = id
    if(id == 3){
 
      let valor = [];
 


          //this.bioSection.get('uuid').patchValue(itens.uuid);
          this.bioSection.get('uuid').patchValue(itens.uuid);
          this.bioSection.get('uuidWhitelabel').patchValue(itens.uuidWhitelabel);
          this.bioSection.get('uuidAccountPayment').patchValue(itens.uuidAccountPayment);
          this.bioSection.get('title').patchValue(itens.title);
          this.bioSection.get('description').patchValue(itens.description);
          this.bioSection.get('sequenceWeb').patchValue(itens.sequenceWeb);
          this.bioSection.get('sequenceApp').patchValue(itens.sequenceApp);
          this.bioSection.get('label').patchValue(itens.label );
          this.bioSection.get('url').patchValue(itens.url);
          this.bioSection.get('parameters').patchValue(itens.parameters);
          this.bioSection.get('category').patchValue(itens.category);
          this.bioSection.get('status').patchValue(itens.status);
          this.bioSection.get('inactiveMessage').patchValue(itens.inactiveMessage);
          this.bioSection.get('iconApp').patchValue(itens.iconApp);
          this.bioSection.get('iconWeb').patchValue(itens.iconWeb);
          this.bioSection.get('showApp').patchValue(itens.showApp);
          this.bioSection.get('showWeb').patchValue(itens.showWeb);
          this.bioSection.get('showBo').patchValue(itens.showBo);
          this.bioSection.get('accountNumber').patchValue(itens.accountNumber);
          // this.bioSection.get('aplication').patchValue(itens.aplication);
          if(this.bioSection.value.showApp == true){
            valor.push('App')
          }
          if(this.bioSection.value.showWeb == true){
            valor.push('Web')
          }
          if(this.bioSection.value.showBo == true){
            valor.push('Backoffice')
          }

    

          this.selected = itens.uuidWhitelabel
          this.selectedCategory = itens.category
          this.selectedLabel = itens.label

          this.bioSection.get('aplication').patchValue(valor);
     


    }
   
  }

  loadPreImplantationList() {
    this.preImplantationService
      .getPreImplantation()
      .pipe(
        tap(res => {
          this.implantation = res;
          this.implantation.forEach(element => {
            element.color = this.preImplantationService.implantationColor(element.status);
            element.status = this.preImplantationService.implantationTranslate(element.status);
            
          })
        
          this.dataSource = new MatTableDataSource(this.implantation);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        }),
        catchError(_ => {
          return of(null);
        }),
      ).subscribe();
  }

  async loadAmountByStatus(status: Status) {
    this.preImplantationService
      .getAmount(status)
      .pipe(
        tap(res => {
          if (status === Status.IN_IMPLANTATION) {
            this.amountInPlantation = res[0];
          }
          else if (status === Status.ACTIVE) {
            this.amountActive = res[0];
          }
          else {
            this.amountInactive = res[0];
          }
        }),
        catchError(_ => {
     
          if (status === Status.IN_IMPLANTATION) {
            this.amountInPlantation = { amount: 0 };
          }
          else if (status === Status.ACTIVE) {
            this.amountActive = { amount: 0 };
          }
          else {
            this.amountInactive = { amount: 0 };
          }
          return of(null);
        })).subscribe();
  }

  isEnable() {
    this.datePicker = this.datePicker ? false : true;
  }

  async loadingInImplantation() {
    await this.loadAmountByStatus(Status.IN_IMPLANTATION);
  }

  async loadingActive() {
    await this.loadAmountByStatus(Status.ACTIVE);
  }

  async loadingInactive() {
    await this.loadAmountByStatus(Status.INACTIVE);
  }

  /** FILTRATION */
  applyFilter() {
    let newArray = [] 

    if(this.data.partner && this.data.partner != null && this.data.numberAccout){

      
      
      Object.values(this.dataTable.filteredData).forEach((value)=>{
        if(this.data.partner== "Todos os Parceiros"){
          if(value['uuidWhitelabel'] == null && this.data.numberAccout == value['accountNumber']){

            newArray.push(value)
          }
          else if(value['uuidWhitelabel'] == null){
            newArray.push(value)
          }

          
        }
        else if(this.data.numberAccout == value['accountNumber'] || value['uuidWhitelabel'] == this.data.partner){
        
          
          newArray.push(value)
        }


      })
      
    }
    else{

      Object.values(this.dataTable.filteredData).forEach((value)=>{
       if(this.data.partner && this.data.partner != null){
        if(this.data.partner== "Todos os Parceiros"){
          if(value['uuidWhitelabel'] == null){

            newArray.push(value)
          }
        }else if(value['uuidWhitelabel'] == this.data.partner){
   
          newArray.push(value)
        }
      }
     
      if(this.data.numberAccout && value['accountNumber'] != undefined){
        let account = value['accountNumber'].toString()
        let numberAccout =  this.data.numberAccout.toString()
        const regex = new RegExp(numberAccout);

        if (regex.test(account)) {
          newArray.push(value)
        } else {
        null
        }


      }

      // if(this.data.numberAccout == value['accountNumber']){
        
      //   newArray.push(value)
      // }

      if(!this.data.numberAccout && !this.data.partner){

        newArray.push(value)
      }


      })

          }


          if(this.data.category){
      
            let newA = []
      
           newArray.forEach((value)=> {
            if(value['category'] ==this.data.category){
              newA.push(value)
           
            }
           })
        

          newArray = newA

          }
        
          if(this.data.type){
            // let type: any = ''
            // if(this.data.type == 'App'){
            //   type = 'showApp'
            // }
            // else if(this.data.type == 'Webbanking'){
            //   type = 'showWe'
            // }else{
            //   type = 'showBo'
            // }
       
            let newA = []
            newArray.forEach((value)=> {
           
              if(this.data.type == 'App' && value.showApp == true){
                newA.push(value)
              }
              else if(this.data.type == 'Webbanking' && value.showWeb == true){
                newA.push(value)
                  
              }else if(this.data.type == 'Backoffice' && value.showBo == true){
                newA.push(value)
              }

            //  if(value['aplication'].substr(0,2) == this.data.type.substr(0,2)){
            //   newA.push(value)
            //  }
             })
             newArray = newA

          }

          if(this.data.status){
   
            let newA = []
            newArray.forEach((value)=> {

             if(value['status'] == this.data.status){
              newA.push(value)
             }
             })
             newArray = newA
          }


     
          
    
      
    // }

    this.dataSource = new MatTableDataSource(newArray);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;




   
    // this.dataSource.filter = this.searchInput.nativeElement.value;
  }

  exportToExcel() {
    const ws: xlsx.WorkSheet = xlsx.utils.table_to_sheet(this.implantation);
    const wb: xlsx.WorkBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    xlsx.writeFile(wb, 'epltable.xlsx');
  }

  onDateChange(date: NgbDateStruct) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && after(date, this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }
  editProject(element) {
    // this.router.navigate([`/app/implantation/projects/${element._id}`]);
    this.router.navigate(['edit', element._id], { relativeTo: this.activatedRoute });
  }

  isHovered = (date) =>
    this.fromDate && !this.toDate && this.hoveredDate && after(date, this.fromDate) && before(date, this.hoveredDate);
  isInside = (date) => after(date, this.fromDate) && before(date, this.toDate);
  isFrom = (date) => equals(date, this.fromDate);
  isTo = (date) => equals(date, this.toDate);
}

