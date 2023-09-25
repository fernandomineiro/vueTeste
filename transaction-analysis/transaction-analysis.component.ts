import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatTableDataSource } from '@angular/material/table';
import { TransactionAnalysisService } from '@wlp/ui-bs-financial';
import { UserInfoService, UserInfoProfile } from '@wlp/ui-bs-oauth-bo';
import { of, ReplaySubject, Subject } from 'rxjs';
import { catchError, tap, takeUntil } from 'rxjs/operators';
import { MetaInterface } from '@wlp/ui-px-financial/lib/dto/list-transaction-analysis-interface';
import { TransactionAnalysisInterface, TransactionAnalysisStatus } from '@wlp/ui-px-financial';
import swal from 'sweetalert2';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { Router } from '@angular/router';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { DeclinedTransactionsService } from '@wlp/ui-bs-account-manager';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'kt-transaction-analysis',
  templateUrl: './transaction-analysis.component.html',
  styleUrls: ['./transaction-analysis.component.scss'],
})
export class TransactionAnalysisComponent implements OnInit {
  displayedColumns = [
    'whitelabel',
    'accountPayment',
    'operation',
    'type',
    'valueTransaction',
    'statusRestrictionList',
    'statusAntiFraud',
    'status',
    'analysisReason',
    'analystUser',
    'dateRegister',
    'dateUpdated',
    'reproveAction',
    'aproveAction',
  ];
  dataSource: MatTableDataSource<TransactionAnalysisInterface> = new MatTableDataSource();
  transactionAnalysis: Array<TransactionAnalysisInterface>;

  dateStart = ''
  dateEnd = ''
  whitelabelFilter = '';

  whiteLabel: Array<{ uuid: string; name: string; fantasyName: string }>;
  whiteLabelCtrl: FormControl = new FormControl();
  whiteLabelFilterCtrl: FormControl = new FormControl();
  whiteLabelname: string;
  form: FormGroup;

  filteredWhiteLabel: ReplaySubject<{ uuid: string; name: string }[]> = new ReplaySubject<
  { uuid: string; name: string }[]
>(1);

uuidWhitelabel: string;
enableCombo = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  // @ViewChild('sort1') sort: MatSort;
  // @ViewChild('searchInput') searchInput: ElementRef;
  // @ViewChild('element', { static: false }) element: ElementRef;

  userInfo: UserInfoProfile;
  relatadoReprovar: string;
  parecerReprovar: string;
  motivo: string = '';
  aprovadoMotivo: string;
  private destroy$: Subject<null> = new Subject();
  selectedTransactionAnalysis: TransactionAnalysisInterface;
  pagination: MetaInterface = {
    page: 1,
    limit: 10,
    itemCount: 0,
  };
  pageSizeOptions = [10, 50, 100];

  motivos = [
    {
      description: 'Analista não conseguiu contato com titular da conta',
      value: 'Analista não conseguiu contato com titular da conta',
    },
    {
      description: 'Titular da conta não reconhece transação',
      value: 'Titular da conta não reconhece transação',
    },
    {
      description: 'Analista não identificou o titular da conta',
      value: 'Analista não identificou o titular da conta',
    },
  ];

  typeForm: FormControl = new FormControl();
  listRestrictionForm: FormControl = new FormControl();
  antFraudForm: FormControl = new FormControl();
  statusManualAnalysisForm: FormControl = new FormControl();

  constructor(
    public loader: LoadingBarService,
    protected userInfoService: UserInfoService,
    private modalService: NgbModal,
    private transactionAnalysisService: TransactionAnalysisService,
    private router: Router,
    private serviceWl: DeclinedTransactionsService,
  ) {
    this.uuidWhitelabel = environment.wlp;
  }

  ngAfterViewInit() {}

  ngOnInit() {
    /**
     * CONFIG PAGINATION
     */
    this.dataSource.paginator = this.paginator;

    if (this.isPermissionAction('bo-admin')) {
      this.loadUserInfo();
      this.getWhiteLabel();
    } else {
      this.router.navigate(['app']);
    }
  }

  applyFilter() {
    this.loader.start();
    this.getTransactionAnalysis();
    this.loader.complete();
  }

  changeWhiteLabel() {
    this.whitelabelFilter = this.whiteLabelCtrl.value;
  }

  startDateChange(event) {
    this.dateStart = event.toISOString().slice(0, 10)
  }

  endDateChange(event) {
    this.dateEnd = event.toISOString().slice(0, 10)
  }

  getWhiteLabel() {
    this.serviceWl
      .getDataWhiteLabel()
      .pipe(
        takeUntil(this.destroy$),
        tap((res) => {
          this.whiteLabel = [{ uuid: '', name: 'Todos', fantasyName: 'Todos' }];
          this.whiteLabel = this.whiteLabel.concat(res as Array<any>);
          // filter list
          this.changeFilterWhiteLabel();
          this.getTransactionAnalysis();
        }),
        catchError((_) => {
          return of(null);
        })
      )
      .subscribe();
  }

  private changeFilterWhiteLabel() {
    if (this.uuidWhitelabel == 'c16bc861-e249-11ea-b552-42642db3fedc') {
      this.whiteLabelCtrl.setValue(this.whiteLabel[0]);
      this.enableCombo = false;
    } else {
      this.whiteLabelCtrl.setValue(this.uuidWhitelabel);
      this.changeWhiteLabel();
    }
    this.filteredWhiteLabel.next(this.whiteLabel.slice());
    this.whiteLabelFilterCtrl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.filterWhiteLabel())
      )
      .subscribe();
  }

  f(control: string): AbstractControl {
    return this.form.get(control);
  }

  protected filterWhiteLabel() {
    if (!this.whiteLabel) {
      return;
    }

    let search = this.whiteLabelFilterCtrl.value;
    if (!search) {
      this.filteredWhiteLabel.next(this.whiteLabel.slice());
      return;
    } else {
      search = search.toLowerCase();
    }

    this.filteredWhiteLabel.next(
      this.whiteLabel.filter((whiteLabel) => whiteLabel.fantasyName.toLowerCase().indexOf(search) > -1)
    );
  }

  getTransactionAnalysis() {
    this.loader.start();
    const pagination: MetaInterface = {
      limit: this.pagination.limit,
       page: this.pagination.page,
       type: this.typeForm.value || '',
       statusAntiFraud: this.antFraudForm.value || '',
       statusRestrictionList: this.listRestrictionForm.value || '',
       status: this.statusManualAnalysisForm.value || '',
       startDate: this.dateStart || '',
       endDate: this.dateEnd || '',
       uuidWhiteLabel: this.whitelabelFilter || ''
       };
    this.transactionAnalysisService
      .getTransactionAnalysis(pagination)
      .pipe(
        tap((res) => {
          this.transactionAnalysis = res.data;

          this.transactionAnalysis.forEach((transaction) => {
            transaction.statusTranslate = this.transactionAnalysisService.statusTranslate(transaction.status);
            transaction.statusRestrictionListTranslate = this.transactionAnalysisService.statusTranslate(
              transaction.statusRestrictionList
            );
            transaction.statusAntiFraudTranslate = this.transactionAnalysisService.statusTranslate(
              transaction.statusAntiFraud
            );
          });

          this.dataSource.data = this.transactionAnalysis;
          this.paginator.length = res.meta.itemCount;
          this.paginator.pageIndex = res.meta.page - 1;

          console.log(this.dataSource);

          this.loader.complete();
        }),
        catchError((_) => {
          this.loader.complete();
          return of(null);
        })
      )
      .subscribe();
  }

  onChangeMotivo(value) {
    this.motivo = value;
  }

  /** FILTER */
  // applyFilter() {
  //   this.dataSource.filter = this.searchInput.nativeElement.value;
  // }

  open(content, element) {
    this.selectedTransactionAnalysis = element;
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {},
      (reason) => {
        this.getTransactionAnalysis();
      }
    );
  }

  reproveRequest() {
    this.loader.start();
    const postData = {
      uuidAccountPayment: this.selectedTransactionAnalysis.accountPayment.uuid,
      status: TransactionAnalysisStatus.REPROVED,
      denyReason: this.motivo,
      denyDescription: this.relatadoReprovar,
      analysisReason: this.parecerReprovar,
      analystUser: this.userInfo.nameComplete,
    };

    this.transactionAnalysisService
      .sendTransactionAnalysis(this.selectedTransactionAnalysis.uuid, postData)
      .pipe(
        tap(() => {
          this.loader.complete();
          this.notification('success', 'Operação Reprovada', 'A operação foi reprovada com sucesso.');
          this.relatadoReprovar = '';
          this.parecerReprovar = '';
          this.getTransactionAnalysis();
        }),
        catchError((err) => {
          console.log(err);
          this.loader.complete();
          this.notification('error', null, err.data?.message || 'Falha ao completar requisição');
          this.relatadoReprovar = '';
          this.parecerReprovar = '';
          return of(null);
        })
      )
      .subscribe();

    this.modalService.dismissAll();
  }

  aproveRequest() {
    this.loader.start();

    const postData = {
      uuidAccountPayment: this.selectedTransactionAnalysis.accountPayment.uuid,
      status: TransactionAnalysisStatus.APPROVED,
      analysisReason: this.aprovadoMotivo,
      analystUser: this.userInfo.nameComplete,
    };

    this.transactionAnalysisService
      .sendTransactionAnalysis(this.selectedTransactionAnalysis.uuid, postData)
      .pipe(
        tap(() => {
          this.loader.complete();
          this.notification('success', 'Operação Aprovada', 'A operação foi aprovada com sucesso.');
          this.getTransactionAnalysis();
        }),
        catchError((err) => {
          console.log(err);
          this.loader.complete();
          this.notification('error', null, err.data?.message || 'Falha ao completar requisição');
          return of(null);
        })
      )
      .subscribe();

    this.modalService.dismissAll();
  }

  loadUserInfo() {
    this.userInfoService.getInfoProfile().then((res) => {
      this.userInfo = res;
    });
  }

  isPermissionAction(role) {
    return this.userInfoService.isUserInRole(role);
  }

  closeModal() {
    this.relatadoReprovar = '';
    this.parecerReprovar = '';
    this.modalService.dismissAll();
  }

  updatePagination(event: PageEvent) {
    this.pagination.limit = event.pageSize;
    this.pagination.page = event.pageIndex + 1;

    this.getTransactionAnalysis();
  }

  isAllowedActions(element: TransactionAnalysisInterface) {
    if (
      element.statusAntiFraud === TransactionAnalysisStatus.IN_ANALYSIS ||
      element.statusRestrictionList === TransactionAnalysisStatus.IN_ANALYSIS
    ) {
      return false;
    } else {
      return element.status === TransactionAnalysisStatus.IN_ANALYSIS;
    }
  }

  notification(type, title: string = 'Atenção', message: string) {
    swal.fire({
      icon: type,
      title,
      text: message,
    });
  }

  formatCellphone(phone: string) {
    phone = String(phone).replace(/\D/g, '');

    if (phone.length > 10) {
      return phone.replace(/^(\d{2})(\d{5})(\d{4})+?$/, '($1) $2-$3');
    }

    return phone.replace(/^(\d{2})(\d{4})(\d{4})+?$/, '($1) $2-$3');
  }

  formatDocument(document: string) {
    document = String(document).replace(/\D/g, '');

    if (document.length > 11) {
      return document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})+?$/, '$1.$2.$3/$4-$5');
    }

    return document.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})+?$/, '$1.$2.$3-$4');
  }

  formatAccountNumber(n: string) {
    n = String(n).replace(/\D/g, '');

    return `${n.substring(0, n.length - 1)}-${n.substring(n.length - 1)}`;
  }

  getStatusCssClass(status: string): string {
    let cssClass = 'status-box ';

    switch (status) {
      case 'APPROVED':
        cssClass += 'success';
        break;
      case 'REPROVED':
        cssClass += 'error';
        break;
      case 'IN_ANALYSIS':
        cssClass += 'warn';
        break;
      case 'NOT_VERIFIED':
        cssClass += '';
        break;
        case 'WARNING':
          cssClass += 'purple';
          break;
      case 'FAIL':
        cssClass += 'error-dark';
        break;
      default:
        cssClass += 'success';
        break;
    }

    return cssClass;
  }

  getStatusTranslate(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'Aprovado';
      case 'REPROVED':
        return 'Reprovado';
      case 'IN_ANALYSIS':
        return 'Em Análise';
      case 'NOT_VERIFIED':
        return 'Não Verificado';
        case 'WARNING':
          return 'Alerta';
      case 'FAIL':
        return 'Falha';
      default:
        return status;
    }
  }
}
