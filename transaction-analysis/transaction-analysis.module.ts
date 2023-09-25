import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TransactionAnalysisComponent } from './transaction-analysis.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { UiCSubheaderModule } from '@wlp/ui-c-subheader';
import { UiBsOauthBoModule } from '@wlp/ui-bs-oauth-bo';
import { UiBsFinancialModule } from '@wlp/ui-bs-financial';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { InterceptService } from '../../../core/intercept/intercept.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { UiBsAccountManagerModule, DeclinedTransactionsService } from '@wlp/ui-bs-account-manager'

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    UiCSubheaderModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    UiBsFinancialModule,
    MatSortModule,
    UiBsOauthBoModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule,
    UiBsAccountManagerModule,
    RouterModule.forChild([
      {
        path: '',
        component: TransactionAnalysisComponent,
      },
    ]),
    FormsModule,
  ],
  providers: [
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        hasBackdrop: true,
        panelClass: 'kt-mat-dialog-container__wrapper',
        height: 'auto',
        width: '600px',
      },
    },
    InterceptService,
    DeclinedTransactionsService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptService,
      multi: true,
    },
  ],
  declarations: [TransactionAnalysisComponent],
})
export class TransactionAnalysisModule {}
