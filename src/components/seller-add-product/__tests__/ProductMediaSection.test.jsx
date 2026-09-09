import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductMediaSection from '../ProductMediaSection';
import * as apiModule from '../../../utils/api';

// Mock api utility
vi.mock('../../../utils/api', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message, status, data) {
      super(message);
      this.status = status;
      this.data = data;
    }
  }
}));

// Mock ToastContext
vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  })
}));

describe('ProductMediaSection — Real Backend Image Endpoints & Upload UI', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // TEST 1: Renders honest empty state when 0 images exist
  it('1. renders honest "No images uploaded yet" state when product has 0 images', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint) => {
      if (endpoint.includes('/images/')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    render(<ProductMediaSection productId={10} />);

    await waitFor(() => {
      expect(screen.getByText('No images uploaded yet')).toBeTruthy();
      expect(screen.getByText('0 / 10 Images Uploaded')).toBeTruthy();
    });

    expect(screen.queryByText('Backend Upload Service Coming Soon')).toBeNull();
    expect(screen.queryByText('Image Upload Service In Development')).toBeNull();
  });

  // TEST 2: Displays existing images from GET response
  it('2. displays existing image assets fetched from GET /api/products/vendor/products/<pk>/images/', async () => {
    const mockImages = [
      { id: 101, image: '/media/products/img1.png', is_primary: true, display_order: 0 },
      { id: 102, image: '/media/products/img2.png', is_primary: false, display_order: 1 }
    ];

    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint) => {
      if (endpoint.includes('/images/')) {
        return Promise.resolve(mockImages);
      }
      return Promise.resolve([]);
    });

    render(<ProductMediaSection productId={10} />);

    await waitFor(() => {
      expect(screen.getByText('2 / 10 Images Uploaded')).toBeTruthy();
      expect(screen.getAllByText('Primary').length).toBeGreaterThan(0);
      expect(screen.getByText('#0')).toBeTruthy();
      expect(screen.getByText('#1')).toBeTruthy();
    });
  });

  // TEST 3: Surfaces verbatim backend 400 error message for oversized or wrong-type file
  it('3. surfaces verbatim 400 error message on upload failure (e.g. file too large / invalid type / limit reached)', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (options?.method === 'POST') {
        return Promise.reject(
          new apiModule.ApiError('Bad Request', 400, {
            image: ['Image files must not exceed 5 MiB.']
          })
        );
      }
      return Promise.resolve([]);
    });

    const { container } = render(<ProductMediaSection productId={10} />);

    await waitFor(() => {
      expect(screen.getByText('0 / 10 Images Uploaded')).toBeTruthy();
    });

    // Simulate selecting an oversized file
    const file = new File(['dummy content'], 'huge.png', { type: 'image/png' });
    const fileInput = container.querySelector('input[type="file"]');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Media Upload Validation Error')).toBeTruthy();
      expect(screen.getByText('Image files must not exceed 5 MiB.')).toBeTruthy();
    });
  });

  // TEST 4: Delete image calls DELETE endpoint and updates list after 204 confirmation
  it('4. deletes an image via DELETE endpoint and updates list after 204 confirmation', async () => {
    let imagesInDb = [
      { id: 201, image: '/media/products/photo.jpg', is_primary: true, display_order: 0 }
    ];

    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (options?.method === 'DELETE') {
        imagesInDb = [];
        return Promise.resolve(null);
      }
      if (endpoint.includes('/images/')) {
        return Promise.resolve(imagesInDb);
      }
      return Promise.resolve([]);
    });

    render(<ProductMediaSection productId={10} />);

    await waitFor(() => {
      expect(screen.getByText('1 / 10 Images Uploaded')).toBeTruthy();
      expect(screen.getByText('#0')).toBeTruthy();
    });

    // Click delete button
    const deleteBtn = screen.getByTitle('Delete Image');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        '/api/products/vendor/products/10/images/201/',
        { method: 'DELETE' }
      );
      expect(screen.getByText('No images uploaded yet')).toBeTruthy();
      expect(screen.getByText('0 / 10 Images Uploaded')).toBeTruthy();
    });
  });

  // TEST 5: Set primary image calls PATCH endpoint and updates primary badge immediately
  it('5. sets target image as primary via PATCH endpoint and updates UI state immediately', async () => {
    let imagesInDb = [
      { id: 301, image: '/media/products/img1.jpg', is_primary: true, display_order: 0 },
      { id: 302, image: '/media/products/img2.jpg', is_primary: false, display_order: 1 }
    ];

    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (options?.method === 'PATCH') {
        imagesInDb = imagesInDb.map(img => ({
          ...img,
          is_primary: img.id === 302
        }));
        return Promise.resolve(imagesInDb.find(i => i.id === 302));
      }
      if (endpoint.includes('/images/')) {
        return Promise.resolve(imagesInDb);
      }
      return Promise.resolve([]);
    });

    render(<ProductMediaSection productId={10} />);

    await waitFor(() => {
      expect(screen.getByText('2 / 10 Images Uploaded')).toBeTruthy();
    });

    // Find "Set Primary" button for image 302
    const setPrimaryBtn = screen.getByTitle('Set as Primary');
    fireEvent.click(setPrimaryBtn);

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        '/api/products/vendor/products/10/images/302/',
        {
          method: 'PATCH',
          body: JSON.stringify({ is_primary: true })
        }
      );
    });
  });

  // TEST 6: Renders unmissable blocked state and disables dropzone when productId is null
  it('6. renders blocked state card and does not fetch or guess arbitrary products when productId is null', async () => {
    render(<ProductMediaSection productId={null} />);

    expect(screen.getByTestId('media-section-blocked-state')).toBeTruthy();
    expect(screen.getByText('Save Product Draft to Enable Studio Gallery')).toBeTruthy();
    expect(screen.getByText('Save Draft Required')).toBeTruthy();
    expect(screen.queryByText('Drag & Drop Studio Images Here')).toBeNull();
    expect(apiModule.apiRequest).not.toHaveBeenCalled();
  });

  // TEST 7: Unlocks upload zone when productId prop updates from null to valid ID
  it('7. unlocks upload zone when productId prop updates from null to a valid product ID after draft save', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint) => {
      if (endpoint.includes('/images/')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const { rerender } = render(<ProductMediaSection productId={null} />);

    expect(screen.getByTestId('media-section-blocked-state')).toBeTruthy();
    expect(apiModule.apiRequest).not.toHaveBeenCalled();

    // Simulate clicking Save Draft -> savedProductId becomes 25
    rerender(<ProductMediaSection productId={25} />);

    await waitFor(() => {
      expect(screen.queryByTestId('media-section-blocked-state')).toBeNull();
      expect(screen.getByText('Drag & Drop Studio Images Here')).toBeTruthy();
      expect(apiModule.apiRequest).toHaveBeenCalledWith('/api/products/vendor/products/25/images/');
    });
  });
});

