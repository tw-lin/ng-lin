import { Injectable, inject, signal } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Storage, ref, getDownloadURL, uploadBytes } from '@angular/fire/storage';

import { Agreement } from './agreement.model';
import { AgreementRepository } from './agreement.repository';

@Injectable({ providedIn: 'root' })
export class AgreementService {
  private readonly repository = inject(AgreementRepository);
  private readonly storage = inject(Storage);
  private readonly functions = inject(Functions);

  // ✅ Create callable during injection context with reasonable timeout
  // Document AI typically processes PDFs in 10-60 seconds for normal documents
  // Set timeout to 120 seconds (2 minutes) which is sufficient for most cases
  // If timeout occurs, check backend logs for actual error (likely configuration issue)
  private readonly processDocumentFromStorage = httpsCallable<
    { gcsUri: string; mimeType: string },
    { success: boolean; result: Record<string, unknown> }
  >(this.functions, 'processDocumentFromStorage', { timeout: 120000 });

  private readonly _agreements = signal<Agreement[]>([]);
  private readonly _loading = signal(false);
  private readonly _uploading = signal(false);

  readonly agreements = this._agreements.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly uploading = this._uploading.asReadonly();

  async loadByBlueprint(blueprintId: string): Promise<void> {
    if (!blueprintId) return;
    this._loading.set(true);
    try {
      const data = await this.repository.findByBlueprintId(blueprintId);
      this._agreements.set(data);
    } finally {
      this._loading.set(false);
    }
  }

  async createAgreement(blueprintId: string): Promise<Agreement> {
    const created = await this.repository.createAgreement({ blueprintId });
    this._agreements.update(items => [created, ...items]);
    return created;
  }

  async uploadAttachment(blueprintId: string, agreementId: string, file: File): Promise<string> {
    this._uploading.set(true);
    try {
      const path = `agreements/${agreementId}/${file.name}`;
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await this.repository.saveAttachmentUrl(agreementId, url, path);
      this._agreements.update(items => items.map(a => (a.id === agreementId ? { ...a, attachmentUrl: url, attachmentPath: path } : a)));
      return url;
    } finally {
      this._uploading.set(false);
    }
  }

  async parseAttachment(agreement: Agreement): Promise<void> {
    console.log('[AgreementService] Starting parseAttachment', {
      agreementId: agreement.id,
      hasAttachmentUrl: !!agreement.attachmentUrl,
      hasAttachmentPath: !!agreement.attachmentPath
    });

    if (!agreement.attachmentUrl || !agreement.attachmentPath) {
      const error = new Error('缺少附件，無法解析');
      console.error('[AgreementService] Validation failed', error);
      throw error;
    }

    try {
      // 構建 GCS URI
      const storageRef = ref(this.storage, agreement.attachmentPath);
      const bucket: string | undefined = (storageRef as any).bucket;
      const gcsUri = bucket ? `gs://${bucket}/${agreement.attachmentPath}` : null;

      console.log('[AgreementService] GCS URI constructed', { gcsUri, bucket });

      if (!gcsUri) {
        throw new Error('無法取得檔案路徑');
      }

      // 呼叫 Cloud Function
      console.log('[AgreementService] Calling processDocumentFromStorage', { gcsUri });
      const result = await this.processDocumentFromStorage({
        gcsUri,
        mimeType: 'application/pdf'
      });

      console.log('[AgreementService] Document AI processing completed', {
        success: result.data.success,
        hasResult: !!result.data.result
      });

      // 儲存解析結果
      const jsonString = JSON.stringify(result.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const parsedPath = `agreements/${agreement.id}/parsed.json`;

      console.log('[AgreementService] Uploading parsed result', { parsedPath });
      const parsedRef = ref(this.storage, parsedPath);
      await uploadBytes(parsedRef, blob);

      const parsedUrl = await getDownloadURL(parsedRef);
      console.log('[AgreementService] Parsed JSON uploaded', { parsedUrl });

      await this.repository.saveParsedJsonUrl(agreement.id, parsedUrl, parsedPath);
      console.log('[AgreementService] Repository updated');

      // 更新本地狀態
      this._agreements.update(items =>
        items.map(item => (item.id === agreement.id ? { ...item, parsedJsonUrl: parsedUrl, parsedJsonPath: parsedPath } : item))
      );

      console.log('[AgreementService] Parse completed successfully');
    } catch (error) {
      console.error('[AgreementService] Parse failed', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details
      });
      throw error; // 重新拋出以便 UI 層處理
    }
  }

  async updateTitle(agreementId: string, title: string): Promise<void> {
    await this.repository.updateAgreement(agreementId, { title });
    this._agreements.update(items => items.map(a => (a.id === agreementId ? { ...a, title } : a)));
  }

  async deleteAgreement(agreementId: string): Promise<void> {
    await this.repository.deleteAgreement(agreementId);
    this._agreements.update(items => items.filter(a => a.id !== agreementId));
  }
}
