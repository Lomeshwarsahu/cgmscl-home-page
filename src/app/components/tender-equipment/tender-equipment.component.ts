import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { NavbarComponent } from 'src/app/navbar/navbar.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MaterialModule } from 'src/app/material-module';
import { CommonModule, NgFor, NgStyle } from '@angular/common';
import {
  atchment,
  AttachmentItem,
  Data_model,
  MergedDataModel,
} from 'src/app/model/model';
import { ApiServiceService } from 'src/app/service/api-service.service';
import { MatTableExporterModule } from 'mat-table-exporter';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { Base } from 'src/app/helper/base';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, from, of } from 'rxjs';
import { map, catchError, toArray, mergeMap } from 'rxjs/operators';
interface UiRow extends Data_model {
  rowSpan: number;
  groupIndex: number;
}
@Component({
  standalone: true,
  selector: 'app-tender-equipment',
  imports: [
    NavbarComponent,
    MaterialModule,
    MatSortModule,
    MatPaginatorModule,
    MatTableModule,
    MatTableExporterModule,
    CommonModule,
    ToastrModule,
    TranslateModule,
  ],
  templateUrl: './tender-equipment.component.html',
  styleUrl: './tender-equipment.component.css',
})
export class TenderEquipmentComponent {
  // TenderEquip

  dataSource!: MatTableDataSource<Data_model>;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('sort') sort!: MatSort;
  dispatchData: Data_model[] = [];
  // DrugTenderList: Data_model []=[];
  displayedColumns: string[] = [
    'sno',
    'subject',
    'caption',
    'content_Publising_Date',
    'action',
  ];
  selectedColor: any;
  base: any;
  pageSize = 10;
  pageIndex = 0;
  displayData: UiRow[] = [];
  originalData: Data_model[] = [];
  originalFilteredData: Data_model[] = [];
  filteredData: Data_model[] = [];
  constructor(
    public Service: ApiServiceService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
    const lang = sessionStorage.getItem('language') || 'en';
    this.translate.use(lang);
    this.dataSource = new MatTableDataSource<Data_model>([]);
    this.base = Base;
  }
  onPageChange(event: any) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }
  setTableData(data: Data_model[]) {
    this.originalFilteredData = data;
    this.pageIndex = 0; // reset page on filter
    //  this.filteredData = data;
    // this.pageIndex = 0;
  }
  //       setTableData(data: Data_model[]) {
  //   this.displayData = this.prepareRows(data);
  // }
  // get pagedData(): UiRow[] {
  //   const start = this.pageIndex * this.pageSize;
  //   const end = start + this.pageSize;

  //   return this.displayData.slice(start, end);
  // }
  get pagedData(): UiRow[] {
    // 1. filter data already stored in originalData via setTableData
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;

    const pageData = this.originalFilteredData.slice(start, end);

    // 2. IMPORTANT: grouping only for current page
    return this.prepareRows(pageData);
  }
  ngOnInit(): void {
    this.selectedColor = sessionStorage.getItem('selectedColor');
    document.documentElement.style.setProperty(
      '--theme-gradient',
      this.selectedColor,
    );

    this.GetEquipmentListAll();
    // this.GetEquipmentListAlll();
    // this.loadTenders();
  }
  //#region
  // https://www.cgmsc.gov.in/himis_apin/api/WebCgmsc/GetEquipmentListAll
  GetEquipmentListAll() {
    try {
      this.spinner.show();

      this.Service.get('GetEquipmentListAll')
        // this.Service.get('GetDrugTenderList?n=0')
        .subscribe(
          // (res) => {
          //   this.dispatchData = res.map(
          //     (item: Data_model, index: number) => ({
          //       ...item,
          //       sno: index + 1,
          //     })
          //   );
          //   console.log('GetEquipmentListAll=:', this.dispatchData);
          //   this.dataSource.data = this.dispatchData;
          //   this.dataSource.paginator = this.paginator;
          //   this.dataSource.sort = this.sort;
          //   this.cdr.detectChanges();
          //   this.spinner.hide();
          // },
          (res: any) => {
            // const finalList = this.dedupeSubjectAndSnoVisually(res);
            // console.log("res =", res);
            this.originalData = res;
            this.setTableData(res);
            const finalList = this.prepareRows(res);
            this.dispatchData = finalList;
            this.dataSource.data = finalList;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.cdr.detectChanges();
            // console.log("equpment =", this.dispatchData);
            this.spinner.hide();
          },

          (error) => {
            this.spinner.hide();
            // this.toastr.error('Something went wrong!', 'Error');
            // alert(`Error fetching data: ${JSON.stringify(error.message)}`);
            this.toastr.error(`Error fetching data: ${error.message}`, 'Error');
          },
        );
    } catch (err: any) {
      // console.log(err);
      this.spinner.hide();
      this.toastr.error(`Error fetching data: ${err.message}`, 'Error');
      // throw err;
    }
  }

  isNewContent(publishingDate: string): boolean {
    const parts = publishingDate.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);

      const published = new Date(year, month, day);
      const today = new Date();

      // Reset time portion to midnight for both
      published.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffInMs = today.getTime() - published.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      return diffInDays >= 0 && diffInDays <= 7; // Only within past 7 days
    }

    return false; // If invalid format
  }

  prepareRows(data: Data_model[]): UiRow[] {
    const out: UiRow[] = [];
    let sno = 1,
      group = 0;

    for (let i = 0; i < data.length; ) {
      const key = (data[i].subject || '').trim().toLowerCase();
      let span = 1;
      while (
        i + span < data.length &&
        (data[i + span].subject || '').trim().toLowerCase() === key
      ) {
        span++;
      }

      group++;
      out.push({ ...data[i], sno: sno++, rowSpan: span, groupIndex: group });

      for (let k = 1; k < span; k++) {
        out.push({
          ...data[i + k],
          sno: '' as any,
          subject: '',
          rowSpan: 0,
          groupIndex: group,
        });
      }

      i += span;
    }

    return out;
  }
  // applyTextFilter(event: Event) {
  //   const value = (event.target as HTMLInputElement).value
  //     .trim()
  //     .toLowerCase();

  //   const filtered = this.originalData.filter(x =>
  //     (x.subject || '').toLowerCase().includes(value) ||
  //     (x.caption || '').toLowerCase().includes(value)
  //   );

  //   this.setTableData(filtered);
  // }
  applyTextFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();

    const filtered = this.originalData.filter(
      (x) =>
        (x.subject || '').toLowerCase().includes(value) ||
        (x.caption || '').toLowerCase().includes(value),
    );

    this.setTableData(filtered);
  }
  // applyTextFilter(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.dataSource.filter = filterValue.trim().toLowerCase();
  // }
  exportToPDF() {}

  onButtonClick(attachment_Id: any) {
    // console.log(attachment_Id);
    // this.router.navigate(['/AttachmentList']);
    // this.router.navigate(['/AttachmentList'], {
    //   queryParams: {Id: attachment_Id, name: 'Equipment-Technical' }
    // });
    const encryptedId = this.base.encryptUsingAES256(attachment_Id);

    this.router.navigate(['/AttachmentList'], {
      queryParams: { Id: encryptedId, name: 'Equipment-Technical' },
    });
  }

  // Example: convert "30/05/2025" to Date object
  convertToDate(d: string): Date | null {
    const parts = d.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-based
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  }

  // GetContentAttachment(content_Registration_Id: string,attachment_Id:any) {
  //   debugger
  //   if (!content_Registration_Id) {
  //     this.toastr.error('Attachment Id is missing!', 'Error!');
  //     return;
  //   }
  //   this.spinner.show();
  //    console.log('content_Registration_Id:', content_Registration_Id);
  //    console.log('attachment_Id:', attachment_Id);
  //           // console.log('FilePath:', filePath);
  //   this.Service.get(`GetContentAttachment?contentRegId=${content_Registration_Id}`)
  //     .subscribe({
  //       next: (res) => {
  //         const first = res[0];
  //         if (first) {
  //           const { fileName, filePath } = first;
  //           console.log('FileName:', fileName);
  //           console.log('FilePath:', filePath);
  //           if (fileName && filePath) {
  //             // Remove '~' from the start of the URL
  //             const cleanedUrl = 'https://cgmsc.gov.in/cgmscl/' + filePath.replace(/^~\//, '');
  //             console.log('Opening:', cleanedUrl);
  //             window.open(cleanedUrl, '_blank');
  //           } else {
  //             this.toastr.error('⚠️ Alert: Attachment File Not Found!\n\nThe requested document is missing.\nPlease try again later or contact support.', 'Error!');
  //             // alert(
  //             //   '⚠️ Alert: Attachment File Not Found!\n\nThe requested document is missing.\nPlease try again later or contact support.'
  //             // );
  //           }
  //           /* Example: direct download / open
  //              window.open(filePath, '_blank');
  //           */

  //         } else {
  //           this.toastr.warning('No attachment data returned!', 'Warning');
  //         }
  //         this.spinner.hide();
  //       },
  //       error: (err) => {
  //         this.spinner.hide();
  //         this.toastr.error(`Error fetching data: ${err.message}`, 'Error!');
  //       }
  //     });
  // }

  GetContentAttachment(content_Registration_Id: string, caption: any) {
    // debugger;

    if (!content_Registration_Id) {
      this.toastr.error('Attachment Id is missing!', 'Error!');
      return;
    }

    this.spinner.show();

    // console.log('content_Registration_Id:', content_Registration_Id);
    // console.log('Selected caption:', caption);

    this.Service.get(
      `GetContentAttachment?contentRegId=${content_Registration_Id}`,
    ).subscribe({
      next: (res) => {
        const matched = res.find(
          (x: any) => x.caption?.trim() === caption?.trim(),
        );

        console.log('Matched Record:', matched);

        if (matched) {
          const { fileName, filePath } = matched;

          console.log('FileName:', fileName);
          console.log('FilePath:', filePath);

          if (fileName && filePath) {
            const cleanedUrl =
              'https://cgmsc.gov.in/cgmscl/' + filePath.replace(/^~\//, '');

            console.log('Opening:', cleanedUrl);
            window.open(cleanedUrl, '_blank');
          } else {
            this.toastr.error(
              '⚠️ Alert: Attachment File Not Found!\n\nThe requested document is missing.',
              'Error!',
            );
          }
        } else {
          this.toastr.warning('Selected caption file not found!', 'Warning');
        }

        this.spinner.hide();
      },

      error: (err) => {
        this.spinner.hide();
        this.toastr.error(`Error fetching data: ${err.message}`, 'Error!');
      },
    });
  }
  //#endregion

  // GetEquipmentListAlll() {
  //   try {
  //     this.spinner.show();

  //     this.Service.get('GetEquipmentListAll').subscribe(
  //       (res: Data_model[]) => {

  //         // ✅ har row ke liye attachment call
  //         const rowCalls = res.map((row, index) => {
  //           if (!row.attachment_Id) {
  //             return of({ ...row, sno: index + 1, marge: [] });
  //           }

  //           return this.Service
  //             .get(`GetContentAttachment?contentRegId=${row.attachment_Id}`)
  //             .pipe(
  //               map((attachRes: any[]) => {
  //                 const margeData: AttachmentItem[] = (attachRes || []).map(
  //                   (a, i) => ({
  //                     sno: i + 1,
  //                     fileName: a.fileName,
  //                     filePath: a.filePath,
  //                     caption: a.caption,
  //                     displayNew: a.displayNew
  //                   })
  //                 );

  //                 return {
  //                   ...row,
  //                   sno: index + 1,
  //                   marge: margeData
  //                 };
  //               }),
  //               catchError(() =>
  //                 of({ ...row, sno: index + 1, marge: [] })
  //               )
  //             );
  //         });

  //         // ✅ sab rows ko ek sath resolve karo
  //         forkJoin(rowCalls).subscribe(
  //           (finalList: Data_model[]) => {
  //             this.dispatchData = finalList;
  //             this.dataSource.data = finalList;
  //             this.dataSource.paginator = this.paginator;
  //             this.dataSource.sort = this.sort;
  //             this.cdr.detectChanges();
  //             this.spinner.hide();
  //             console.log(" this.dispatchData:", this.dispatchData);
  //           },
  //           (error) => {
  //             this.spinner.hide();
  //             this.toastr.error(`Merge error: ${error.message}`, 'Error');
  //           }
  //         );
  //       },
  //       (error) => {
  //         this.spinner.hide();
  //         this.toastr.error(`Error fetching data: ${error.message}`, 'Error');
  //       }
  //     );
  //   } catch (err: any) {
  //     this.spinner.hide();
  //     this.toastr.error(`Error fetching data: ${err.message}`, 'Error');
  //   }
  // }
  // GetEquipmentListAlll() {
  //   try {
  //     this.spinner.show();

  //     this.Service.get('GetEquipmentListAll').subscribe(
  //       (res: Data_model[]) => {

  //         from(res)
  //           .pipe(
  //             mergeMap(
  //               (row: Data_model, index: number) => {

  //                 if (!row.attachment_Id) {
  //                   return of({ ...row, sno: index + 1, marge: [] });
  //                 }

  //                 return this.Service
  //                   .get(`GetContentAttachment?contentRegId=${row.attachment_Id}`)
  //                   .pipe(
  //                     map((attachRes: any[]) => ({
  //                       ...row,
  //                       sno: index + 1,
  //                       marge: (attachRes || []).map((a, i) => ({
  //                         sno: i + 1,
  //                         fileName: a.fileName,
  //                         filePath: a.filePath,
  //                         caption: a.caption,
  //                         displayNew: a.displayNew
  //                       }))
  //                     })),
  //                     catchError(() =>
  //                       of({ ...row, sno: index + 1, marge: [] })
  //                     )
  //                   );
  //               },
  //               5 // ✅ IMPORTANT: only 5 parallel calls
  //             ),
  //             toArray()
  //           )
  //           .subscribe((finalList: Data_model[]) => {
  //             this.dispatchData = finalList;
  //             this.dataSource.data = finalList;
  //             console.log("finle list=",  this.dispatchData)
  //             this.dataSource.paginator = this.paginator;
  //             this.dataSource.sort = this.sort;
  //             this.cdr.detectChanges();
  //             this.spinner.hide();
  //           });
  //       },
  //       (error) => {
  //         this.spinner.hide();
  //         this.toastr.error(`Error fetching data: ${error.message}`, 'Error');
  //       }
  //     );
  //   } catch (err: any) {
  //     this.spinner.hide();
  //     this.toastr.error(`Error fetching data: ${err.message}`, 'Error');
  //   }
  // }
}
